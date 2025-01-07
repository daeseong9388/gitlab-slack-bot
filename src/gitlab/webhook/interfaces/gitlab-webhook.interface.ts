export interface GitLabUser {
  id: number;
  name: string;
  username: string;
  avatar_url: string;
  email: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  description: string | null;
  web_url: string;
  avatar_url: string | null;
  git_ssh_url: string;
  git_http_url: string;
  namespace: string;
  visibility_level: number;
  path_with_namespace: string;
  default_branch: string;
  ci_config_path: string;
  homepage: string;
  url: string;
  ssh_url: string;
  http_url: string;
}

export interface GitLabNote {
  id: number;
  note: string;
  noteable_type: 'Commit' | 'MergeRequest' | 'Issue' | 'Snippet';
  author_id: number;
  created_at: string;
  updated_at: string;
  project_id: number;
  attachment: any;
  line_code: string | null;
  commit_id: string | null;
  noteable_id: number;
  system: boolean;
  st_diff: any;
  url: string;
  action: string;
  description: string;
  discussion_id: string;
  position: any;
  original_position: any;
  resolved_at: string | null;
  resolved_by_id: number | null;
  resolved_by_push: boolean | null;
  type: string | null;
  updated_by_id: number | null;
}

export interface GitLabCommit {
  id: string;
  message: string;
  title: string;
  timestamp: string;
  url: string;
  author: {
    name: string;
    email: string;
  };
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  url: string;
  source_branch: string;
  target_branch: string;
  assignee_id: number;
  author_id: number;
  created_at: string;
  updated_at: string;
  draft: boolean;
  merge_status: string;
  detailed_merge_status: string;
  work_in_progress: boolean;
  source: GitLabProject;
  target: GitLabProject;
  last_commit: GitLabCommit;
  blocking_discussions_resolved: boolean;
  first_contribution: boolean;
  labels: string[];
  reviewer_ids: number[];
  assignee_ids: number[];
  time_estimate: number;
  total_time_spent: number;
  human_time_estimate: string | null;
  human_total_time_spent: string | null;
  human_time_change: string | null;
  author: { name: string; email: string };
}

export interface GitLabRepository {
  name: string;
  url: string;
  description: string | null;
  homepage: string;
}

export interface GitLabNoteHook {
  object_kind: 'note';
  event_type: 'note';
  user: GitLabUser;
  project_id: number;
  project: GitLabProject;
  object_attributes: GitLabNote;
  repository: GitLabRepository;
  merge_request?: GitLabMergeRequest;
}

export interface GitLabMergeRequestHook {
  object_kind: 'merge_request';
  event_type: 'merge_request';
  user: {
    id: number;
    name: string;
    username: string;
    avatar_url: string;
  };
  project: {
    id: number;
    name: string;
    description: string;
    web_url: string;
    path_with_namespace: string;
  };
  object_attributes: GitLabMergeRequest & {
    action:
      | 'merge'
      | 'open'
      | 'close'
      | 'reopen'
      | 'update'
      | 'approved'
      | 'unapproved';
  };
  reviewers?: {
    id: number;
    name: string;
    username: string;
    avatar_url: string;
  }[];
}
