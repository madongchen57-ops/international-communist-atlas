"""Read-only integrity check against the pre-migration original workspace."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]
old=root.parent/'QmlmReader'
before=json.loads((root/'.local-audit/original-before.json').read_text(encoding='utf-8'))
after={p.relative_to(old).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in old.rglob('*') if p.is_file()}
changed=[k for k in before if k in after and before[k]!=after[k]]
missing=[k for k in before if k not in after]
added=[k for k in after if k not in before]
report={'originalFiles':len(before),'currentFiles':len(after),'changed':changed,'missing':missing,'added':added,'unchanged':not(changed or missing or added)}
(root/'.local-audit/original-integrity.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
if not report['unchanged']:raise SystemExit(1)
