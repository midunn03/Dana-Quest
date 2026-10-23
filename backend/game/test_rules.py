import random
import time
import unittest

from . import rules
from .rules import GameError, apply_action, empty_state


class RulesTest(unittest.TestCase):
    def started(self):
        state = apply_action(empty_state(), {'type': 'assign', 'destinationId': 'cau-rong', 'count': 5}, rng=random.Random(1))
        return state

    def test_assign_picks_count_unique_missions(self):
        entry = self.started()['destinations']['cau-rong']
        self.assertEqual(len(entry['selected']), 5)
        self.assertEqual(len(set(entry['selected'])), 5)

    def test_assign_validates_count_and_place(self):
        with self.assertRaises(GameError):
            apply_action(empty_state(), {'type': 'assign', 'destinationId': 'cau-rong', 'count': 4})
        with self.assertRaises(GameError):
            apply_action(empty_state(), {'type': 'assign', 'destinationId': 'khong-co', 'count': 5})

    def test_complete_self_mission_once_gives_coins(self):
        state = self.started()
        mission = next(m for m in state['destinations']['cau-rong']['selected'] if rules.MISSION_KINDS[m] == 'self')
        done = apply_action(state, {'type': 'complete', 'destinationId': 'cau-rong', 'missionId': mission})
        again = apply_action(done, {'type': 'complete', 'destinationId': 'cau-rong', 'missionId': mission})
        self.assertEqual(rules.earned_coins(again), 10)

    def test_unselected_mission_rejected(self):
        state = self.started()
        other = next(m for m in rules.MISSION_KINDS if m not in state['destinations']['cau-rong']['selected'])
        with self.assertRaises(GameError):
            apply_action(state, {'type': 'complete', 'destinationId': 'cau-rong', 'missionId': other})

    def test_photo_mission_needs_photo(self):
        state = {'version': 1, 'redemptions': [], 'destinations': {'cau-rong': {'selected': ['overview-photo'] + ['read', 'observe', 'walk', 'green'], 'completed': [], 'started': True}}}
        action = {'type': 'complete', 'destinationId': 'cau-rong', 'missionId': 'overview-photo'}
        with self.assertRaises(GameError):
            apply_action(state, action)
        ok = apply_action(state, action, photo_keys={'cau-rong:overview-photo'})
        self.assertIn('overview-photo', ok['destinations']['cau-rong']['completed'])

    def test_arrival_needs_close_fresh_accurate_gps(self):
        state = {'version': 1, 'redemptions': [], 'destinations': {'cau-rong': {'selected': ['arrival', 'read', 'observe', 'walk', 'green'], 'completed': [], 'started': True}}}
        now = int(time.time() * 1000)
        lat, lon = rules.positions()['cau-rong']
        good = {'latitude': lat, 'longitude': lon, 'accuracy': 10, 'timestamp': now - 1000}
        act = lambda loc: {'type': 'complete', 'destinationId': 'cau-rong', 'missionId': 'arrival', 'location': loc}
        apply_action(state, act(good), now_ms=now)
        for bad in ({**good, 'latitude': lat + 0.01}, {**good, 'accuracy': 80}, {**good, 'timestamp': now - 120000}, {**good, 'timestamp': now + 5000}, None):
            with self.assertRaises(GameError):
                apply_action(state, act(bad), now_ms=now)

    def test_redeem_needs_coins_and_only_once(self):
        state = empty_state()
        with self.assertRaises(GameError):
            apply_action(state, {'type': 'redeem', 'rewardId': 'postcard'})
        state['destinations']['x'] = {'selected': list(range(5)), 'completed': ['a', 'b', 'c', 'd'], 'started': True}  # 40 xu
        spent = apply_action(state, {'type': 'redeem', 'rewardId': 'postcard'})
        self.assertEqual(rules.coin_balance(spent), 10)
        with self.assertRaises(GameError):
            apply_action(spent, {'type': 'redeem', 'rewardId': 'postcard'})

    def test_cancel_blocked_after_progress(self):
        state = self.started()
        self.assertNotIn('cau-rong', apply_action(state, {'type': 'cancel', 'destinationId': 'cau-rong'})['destinations'])
        mission = next(m for m in state['destinations']['cau-rong']['selected'] if rules.MISSION_KINDS[m] == 'self')
        done = apply_action(state, {'type': 'complete', 'destinationId': 'cau-rong', 'missionId': mission})
        with self.assertRaises(GameError):
            apply_action(done, {'type': 'cancel', 'destinationId': 'cau-rong'})


if __name__ == '__main__':
    unittest.main()
