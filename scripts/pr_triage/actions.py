#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path

SUMMARY_JSON = Path("pr_triage/summary.json")
DRY_RUN = os.getenv("DRY_RUN", "0") == "1"

LABELS_TO_ENSURE = [
    ("stale", "dddddd", "Automatically closed due to staleness"),
    ("duplicate", "cfd3d7", "This PR duplicates existing work"),
    ("autoclosed", "ffdd57", "Closed in bulk cleanup"),
    ("needs-rebase", "e11d21", "PR has conflicts with base branch"),
    ("keep", "0e8a16", "Selected to keep; needs rebase/update"),
]


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    print("$ " + " ".join(subprocess.list2cmdline([c]) for c in cmd))
    # Only stub GitHub CLI calls in DRY_RUN; allow local commands to actually run
    if DRY_RUN and len(cmd) > 0 and cmd[0] == "gh":
        return subprocess.CompletedProcess(cmd, 0, "", "")
    return subprocess.run(cmd, text=True, capture_output=True)


def load_summary() -> dict:
    if not SUMMARY_JSON.exists():
        print(f"Summary file not found: {SUMMARY_JSON}", file=sys.stderr)
        sys.exit(1)
    return json.loads(SUMMARY_JSON.read_text())


def ensure_labels():
    # Try to list existing labels
    existing = set()
    res = run(["gh", "label", "list", "--json", "name"])
    if res.returncode == 0 and res.stdout:
        try:
            labels_json = json.loads(res.stdout)
            existing = {l.get("name", "") for l in labels_json if isinstance(l, dict)}
        except Exception:
            pass
    # Create missing labels (best-effort)
    for name, color, desc in LABELS_TO_ENSURE:
        if name in existing:
            continue
        cread = run(["gh", "label", "create", name, "--color", color, "--description", desc])
        if cread.returncode != 0:
            print(f"WARN: failed to create label {name}: {cread.stderr.strip()}")


def close_stale_duplicates(data: dict):
    ensure_labels()
    items = data.get("stale_duplicates", [])
    if not items:
        print("No stale duplicates to close.")
        return
    for pr in items:
        num = str(pr["number"])  # PR number
        merged_matches = pr.get("merged_matches", [])
        merged_list = ", ".join(f"#{n}" for n in merged_matches) or "(related merged PR)"
        body = (
            "Closing as stale duplicate. This PR appears to duplicate functionality already landed in PR(s) "
            f"{merged_list}.\n\n"
            "It has been open for over 30 days, so we're closing to keep the queue focused.\n\n"
            "If this still adds value beyond the merged work, please comment and we can reopen, or open a fresh PR rebased on the latest main."
        )
        # Label first (non-fatal), then comment, then close
        run(["gh", "issue", "edit", num, "--add-label", "duplicate", "--add-label", "stale", "--add-label", "autoclosed"])  
        cmt = run(["gh", "pr", "comment", num, "--body", body])
        if cmt.returncode != 0:
            print(f"WARN: comment failed for PR #{num}: {cmt.stderr.strip()}")
        cls = run(["gh", "pr", "close", num])
        if cls.returncode != 0:
            print(f"WARN: close failed for PR #{num}: {cls.stderr.strip()}")
        else:
            print(f"Closed PR #{num}")


def _parse_owner_repo_from_remote(url: str) -> tuple[str | None, str | None]:
    url = url.strip()
    if not url:
        return None, None
    # Examples:
    # https://github.com/owner/repo.git
    # git@github.com:owner/repo.git
    if url.startswith("git@") and ":" in url:
        path = url.split(":", 1)[1]
    else:
        # assume https style
        parts = url.split("github.com/")
        path = parts[1] if len(parts) > 1 else ""
    path = path[:-4] if path.endswith(".git") else path
    if path.count("/") == 1:
        owner, name = path.split("/", 1)
        return owner, name
    return None, None


def get_repo_owner_name() -> tuple[str, str]:
    # 1) Environment overrides
    repo_env = os.getenv("REPO", "").strip()
    if repo_env and "/" in repo_env:
        owner, name = repo_env.split("/", 1)
        if owner and name:
            return owner, name
    owner_env = os.getenv("REPO_OWNER", "").strip()
    name_env = os.getenv("REPO_NAME", "").strip()
    if owner_env and name_env:
        return owner_env, name_env

    # 2) Try to parse from git remote
    try:
        git_res = subprocess.run([
            "git", "config", "--get", "remote.origin.url"
        ], text=True, capture_output=True)
        if git_res.returncode == 0:
            owner, name = _parse_owner_repo_from_remote(git_res.stdout)
            if owner and name:
                return owner, name
    except Exception:
        pass

    # 3) Fallback to gh repo view
    res = run(["gh", "repo", "view", "--json", "name,owner"])
    if res.returncode == 0 and res.stdout:
        try:
            j = json.loads(res.stdout)
            owner = (j.get("owner") or {}).get("login")
            name = j.get("name")
            if owner and name:
                return owner, name
        except Exception:
            pass

    print("ERROR: Could not determine repo owner/name", file=sys.stderr)
    sys.exit(1)


def request_rebases(data: dict):
    ensure_labels()
    items = data.get("conflicted_rebase_subset", [])
    if not items:
        print("No conflicted PRs selected for rebase request.")
        return
    for pr in items:
        num = str(pr["number"])  # PR number
        body = (
            "This PR currently has merge conflicts with the base branch. "
            "We've tagged it to keep and would appreciate a rebase onto the latest main. "
            "If you need help resolving conflicts, please mention a maintainer."
        )
        run(["gh", "issue", "edit", num, "--add-label", "needs-rebase", "--add-label", "keep"])  
        cmt = run(["gh", "pr", "comment", num, "--body", body])
        if cmt.returncode != 0:
            print(f"WARN: comment failed for PR #{num}: {cmt.stderr.strip()}")
        else:
            print(f"Requested rebase on PR #{num}")


def update_branches(data: dict):
    items = data.get("mergeable_update_subset", [])
    if not items:
        print("No mergeable PRs selected for branch update.")
        return
    owner, repo = get_repo_owner_name()
    for pr in items:
        num = str(pr["number"])  # PR number
        # Use REST API: Update a pull request branch
        # https://docs.github.com/en/rest/pulls/pulls#update-a-pull-request-branch
        res = run([
            "gh", "api", f"repos/{owner}/{repo}/pulls/{num}/update-branch", "-X", "PUT",
            "-H", "Accept: application/vnd.github+json",
        ])
        if res.returncode != 0:
            print(f"WARN: update-branch failed for PR #{num}: {res.stderr.strip()}")
        else:
            print(f"Triggered branch update for PR #{num}")


def main():
    if len(sys.argv) < 2:
        print("Usage: actions.py [close-duplicates|request-rebases|update-branches]", file=sys.stderr)
        sys.exit(2)
    action = sys.argv[1]
    data = load_summary()

    if action == "close-duplicates":
        close_stale_duplicates(data)
    elif action == "request-rebases":
        request_rebases(data)
    elif action == "update-branches":
        update_branches(data)
    else:
        print(f"Unknown action: {action}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
