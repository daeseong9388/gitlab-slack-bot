import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface GitLabMRNote {
  id: number;
  body: string;
  author: {
    id: number;
    username: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: string;
  noteable_iid: number;
  resolvable: boolean;
  confidential: boolean;
  internal: boolean;
  merge_request_diff_head_sha?: string;
}

export interface GitLabMRChanges {
  title: string;
  description: string;
  author: {
    username: string;
  };
  changes: Array<{
    old_path: string;
    new_path: string;
    new_file: boolean;
    deleted_file: boolean;
    diff: string;
  }>;
}

export interface CreateGitLabMRNoteRequest {
  body: string;
}

@Injectable()
export class GitLabApiService {
  private readonly logger = new Logger(GitLabApiService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('GITLAB_API_URL');
    const token = this.configService.get<string>('GITLAB_API_TOKEN');
    const fixieUrl = this.configService.get<string>('FIXIE_URL');

    if (!baseURL || !token) {
      throw new Error('GITLAB_API_URL and GITLAB_API_TOKEN must be configured');
    }

    let proxyConfig = undefined;

    if (fixieUrl) {
      try {
        const parsedUrl = new URL(fixieUrl);
        const [username, password] =
          parsedUrl.username && parsedUrl.password
            ? [parsedUrl.username, parsedUrl.password]
            : [];

        proxyConfig = {
          protocol: 'http',
          host: parsedUrl.hostname,
          port: parseInt(parsedUrl.port, 10) || 80,
          ...(username &&
            password && {
              auth: {
                username: decodeURIComponent(username),
                password: decodeURIComponent(password),
              },
            }),
        };
      } catch (error) {
        this.logger.warn('Failed to parse FIXIE_URL', error);
      }
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'PRIVATE-TOKEN': token,
      },
      ...(proxyConfig && { proxy: proxyConfig }),
    });
  }

  async getMergeRequestChanges(
    projectId: number | string,
    mergeRequestIid: number,
  ): Promise<GitLabMRChanges> {
    try {
      const response = await this.client.get<GitLabMRChanges>(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/changes`,
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get merge request changes', {
        error,
        projectId,
        mergeRequestIid,
      });
      throw error;
    }
  }

  /**
   * Add a new note to a merge request
   * @param projectId - The ID or URL-encoded path of the project
   * @param mergeRequestIid - The IID of the merge request
   * @param note - The note content
   * @returns Created merge request note
   */
  async addMergeRequestNote(
    projectId: number | string,
    mergeRequestIid: number,
    note: CreateGitLabMRNoteRequest,
  ): Promise<GitLabMRNote> {
    try {
      const { data } = await this.client.post<GitLabMRNote>(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`,
        note,
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to add note to MR ${mergeRequestIid} in project ${projectId}`,
        error,
      );
      throw error;
    }
  }

  async updateMergeRequestNote(
    projectId: number | string,
    mergeRequestIid: number,
    noteId: number,
    note: GitLabMRNote,
  ): Promise<void> {
    try {
      await this.client.put(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/notes/${noteId}`,
        note,
      );
    } catch (error) {
      this.logger.error('Failed to update merge request note', {
        error,
        projectId,
        mergeRequestIid,
        noteId,
      });
      throw error;
    }
  }

  async deleteMergeRequestNote(
    projectId: number | string,
    mergeRequestIid: number,
    noteId: number,
  ): Promise<void> {
    try {
      await this.client.delete(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/notes/${noteId}`,
      );
    } catch (error) {
      this.logger.error('Failed to delete merge request note', {
        error,
        projectId,
        mergeRequestIid,
        noteId,
      });
      throw error;
    }
  }

  /**
   * Get all notes for a merge request
   * @param projectId - The ID or URL-encoded path of the project
   * @param mergeRequestIid - The IID of the merge request
   * @param options - Optional parameters for sorting and ordering
   * @returns Array of merge request notes
   */
  async getMergeRequestNotes(
    projectId: number | string,
    mergeRequestIid: number,
    options: {
      sort?: 'asc' | 'desc';
      order_by?: 'created_at' | 'updated_at';
    } = {},
  ): Promise<GitLabMRNote[]> {
    try {
      const { data } = await this.client.get<GitLabMRNote[]>(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`,
        {
          params: options,
        },
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to get merge request notes for MR ${mergeRequestIid} in project ${projectId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a single note from a merge request
   * @param projectId - The ID or URL-encoded path of the project
   * @param mergeRequestIid - The IID of the merge request
   * @param noteId - The ID of the note
   * @returns Single merge request note
   */
  async getMergeRequestNote(
    projectId: number | string,
    mergeRequestIid: number,
    noteId: number,
  ): Promise<GitLabMRNote> {
    try {
      const { data } = await this.client.get<GitLabMRNote>(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/notes/${noteId}`,
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to get note ${noteId} for MR ${mergeRequestIid} in project ${projectId}`,
        error,
      );
      throw error;
    }
  }
}
