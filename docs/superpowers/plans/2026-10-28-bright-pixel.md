# Bright pixel implementation
User authorizes attached A→B→C→D without intermediate approval. Work in place; no push. Preserve APIs/storage/progress/challenge contracts/auth operations. UI archive .data/pixel-before/ui-before.zip provides rollback without touching player data.
A: STYLE_PIXEL.md, primitive→semantic→component tokens, PixelUI shared primitives. Palette exact brief; readable Vietnamese body; pixel English labels only.8/16grid artwork.
B: home header + actual hero login + coast/DragonBridge original vector illustration +3steps + real quests/rewards +FAQ/footer. Root remains public for authenticated user with avatar and play link; old auth aliases resolve to root, no provider/callback changes.
C: migrate existing CSS at ownership, remove old style imports/obsolete pixel theme duplication, use shared primitive CSS contract for existing semantic controls. Preserve component handlers. Audit screen inventory.
D: focused and full tests, build/lint, real Chrome VI/EN responsive390/768/1280/wide, reduced motion, accessibility/performance if tool available. Document missing real resources and rollback.
Ruling: supplied detailed design is approved for internal execution (explicit no waiting). No commits of preexisting mixed work; archive before UI edits instead. Referenced midnightbistro site unavailable via web tool; use requested structural description, not invented site details.

Completed A/B/C/D. Evidence:231 tests passed; production Lighthouse95/100/100, CLS0.037;8 responsivehome combinations passed; WCAGaxe0 acrosshome+10game views. Auth backend browserpassed. Report docs/PIXEL-REDESIGN-REPORT.md. Dev5174 running, no push.
