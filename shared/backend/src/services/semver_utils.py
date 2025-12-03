import re

_semver = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")

def parse_semver(s: str):
    m = _semver.match(s or "")
    if not m:
        return (0, 0, 0)
    return tuple(int(x) for x in m.groups())

def bump_version(current: str, level: str) -> str:
    major, minor, patch = parse_semver(current)
    level = (level or "").lower()
    if level == "major":
        return f"{major+1}.0.0"
    if level == "minor":
        return f"{major}.{minor+1}.0"
    # default = patch
    return f"{major}.{minor}.{patch+1}"