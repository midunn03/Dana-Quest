"""Node quest-runs compatibility; trusted catalog, untrusted saved runs/actions."""
import copy
from functools import lru_cache
import json
from pathlib import Path
import re
import time
import unicodedata

from django.conf import settings

from .rules import GameError, _number, empty_state


@lru_cache(maxsize=1)
def catalog():
    return json.loads((Path(settings.BASE_DIR).parent / 'src/data/questCatalog.json').read_text(encoding='utf-8'))


def fresh():
    return {'version': 2, 'legacy': empty_state(), 'quests': {}}


def challenge_correct(challenge, answer='', photo_available=False):
    kind = challenge.get('type')
    if kind == 'photo':
        return bool(photo_available)
    if kind == 'observation':
        return answer == 'confirmed'
    if not isinstance(answer, str) or len(answer) > 5000:
        return False
    if kind == 'text':
        def normalize(value):
            return re.sub('[\u0300-\u036f]', '', unicodedata.normalize('NFD', value)).strip().lower()
        return any(normalize(value) == normalize(answer) for value in challenge['acceptedAnswers'])
    if kind == 'single-choice':
        return answer == challenge['correctOptionId']
    try:
        parsed = json.loads(answer)
    except ValueError:
        return False
    if not isinstance(parsed, list):
        return False
    if kind == 'ordering':
        return parsed == challenge['correctOrder']
    if kind == 'multi-select':
        return (all(isinstance(value, str) for value in parsed) and len(parsed) == len(challenge['correctOptionIds'])
                and len(set(parsed)) == len(parsed) and all(value in challenge['correctOptionIds'] for value in parsed))
    if kind == 'matching':
        if len(parsed) != len(challenge['pairs']) or any(not isinstance(pair, list) or len(pair) != 2 or not all(isinstance(v, str) for v in pair) for pair in parsed):
            return False
        return len({pair[0] for pair in parsed}) == len(parsed) and all(any(item['id'] == pair[0] and item['correctOptionId'] == pair[1] for item in challenge['pairs']) for pair in parsed)
    return False


def read_runs(value):
    state = copy.deepcopy(value)
    if not isinstance(state, dict) or type(state.get('version')) is not int or state['version'] != 2 or not isinstance(state.get('quests'), dict):
        raise GameError(422, 'Dữ liệu quest không hợp lệ. Chưa ghi đè dữ liệu cũ.')
    by_id = {quest['id']: quest for quest in catalog()}
    for key, run in state['quests'].items():
        quest = by_id.get(key)
        if (not isinstance(run, dict) or not isinstance(run.get('completedCheckpointIds'), list)
                or ('catalogVersion' in run and (not _number(run['catalogVersion']) or run['catalogVersion'] < 0))):
            raise GameError(422, 'Tiến độ quest bị hỏng. Chưa ghi đè dữ liệu cũ.')
        if isinstance(run, dict) and key == 'due-dau-an-50-nam' and (run.get('catalogVersion') or 0) < 2:
            run['catalogVersion'] = 2
            if len(run.get('completedCheckpointIds') or []) == 2 and _number(run.get('completedAt')):
                run['previousCompletionAt'] = run.pop('completedAt')
                run['phase'] = 'story'
        completed = run.get('completedCheckpointIds') if isinstance(run, dict) else None
        times = run.get('completedAtByCheckpoint') if isinstance(run, dict) else None
        if (not quest or not isinstance(run, dict) or not _number(run.get('startedAt')) or not isinstance(completed, list)
                or completed != quest['checkpointOrder'][:len(completed)] or len(completed) > len(quest['checkpointOrder'])
                or not isinstance(times, dict) or any(not isinstance(key, str) or not _number(times.get(key)) for key in completed)
                or run.get('phase') not in ('story', 'challenge', 'feedback', 'results')):
            raise GameError(422, 'Tiến độ quest bị hỏng. Chưa ghi đè dữ liệu cũ.')
        complete = len(completed) == len(quest['checkpointOrder'])
        if complete != _number(run.get('completedAt')) or (run['phase'] == 'results' and not complete):
            raise GameError(422, 'Kết quả quest không hợp lệ. Chưa ghi đè dữ liệu cũ.')
    return state


def update_run(state, action):
    if not isinstance(action, dict):
        raise GameError(400, 'Thao tác quest không hợp lệ.')
    quest = next((item for item in catalog() if item['id'] == action.get('questId')), None)
    if not quest:
        raise GameError(400, 'Không tìm thấy quest.')
    state = read_runs(state)
    kind = action.get('type')
    run = state['quests'].get(quest['id'])
    now = int(time.time() * 1000)
    if kind == 'start':
        if not run:
            state['quests'][quest['id']] = {'startedAt': now, 'completedCheckpointIds': [], 'completedAtByCheckpoint': {}, 'phase': 'story', 'paused': False, 'catalogVersion': quest.get('catalogVersion') or 1}
        return state
    if not run:
        raise GameError(400, 'Quest chưa được bắt đầu.')
    if kind == 'confirm-arrival':
        if not run.get('arrivalConfirmedAt'):
            run.update(arrivalConfirmedAt=now, arrivalMethod='visual')
        return state
    if kind in ('pause', 'resume'):
        run['paused'] = kind == 'pause'
        return state
    if not run.get('arrivalConfirmedAt'):
        raise GameError(409, 'Hãy xác nhận đã đến điểm bắt đầu trước khi chơi quest.')
    if run.get('paused'):
        raise GameError(400, 'Quest đang tạm dừng. Hãy tiếp tục hành trình trước.')
    completed = run['completedCheckpointIds']
    index = len(completed)
    if kind == 'continue-story':
        current = quest['checkpointOrder'][index] if index < len(quest['checkpointOrder']) else None
        if action.get('checkpointId') and action['checkpointId'] != current:
            return state
        if run['phase'] == 'challenge':
            return state
        if run['phase'] != 'story':
            raise GameError(409, 'Bước chơi đã thay đổi. Hãy tải lại.')
        run['phase'] = 'challenge'
    elif kind == 'advance':
        if action.get('checkpointId') and action['checkpointId'] != (completed[-1] if completed else None):
            return state
        if run['phase'] in ('story', 'results'):
            return state
        if run['phase'] != 'feedback':
            raise GameError(409, 'Hãy hoàn thành thử thách trước.')
        run['phase'] = 'results' if run.get('completedAt') else 'story'
    elif kind == 'complete-checkpoint':
        if action.get('checkpointId') in completed:
            return state
        checkpoint = quest['checkpoints'][index] if index < len(quest['checkpoints']) else None
        if run['phase'] != 'challenge' or not checkpoint or checkpoint['id'] != action.get('checkpointId'):
            raise GameError(409, 'Hãy hoàn thành checkpoint theo đúng thứ tự.')
        answer = action.get('answer') if isinstance(action.get('answer'), str) else ''
        # Exactly like Node: client photoAvailable is not evidence.
        if not challenge_correct(checkpoint['challenge'], answer):
            raise GameError(400, 'Câu trả lời chưa chính xác. Bạn có thể xem lại chỉ dẫn và thử lần nữa.')
        completed.append(checkpoint['id'])
        run['completedAtByCheckpoint'][checkpoint['id']] = now
        run['phase'] = 'feedback'
        if len(completed) == len(quest['checkpoints']):
            run['completedAt'] = now
    else:
        raise GameError(400, 'Thao tác quest không được hỗ trợ.')
    return state
