export type ConversationMessage = {
  id: string; //前端自动生成
  messageContextId?: string; //大模型的消息id
  creator: 'User' | 'DeepSeek';
  status: 'Completed' | 'Cancelled' | 'Failed' | 'Running';
  fileList: FileDetail[];
  text: string[];
  done: boolean;
};
export type CreateMessageOptions = Partial<Omit<ConversationMessage, 'id'>>;
export type Conversation = {
  id: string; //前端自动生成
  conversationContextId?: string; //大模型的会话id
  title: string;
  content: ConversationMessage[];
  running: boolean;

  createMessage: (opts: CreateMessageOptions) => void;
  startWorkflow: () => void;
  finishWorkflow: () => void;
  startNode: () => void;
  finishNode: () => void;
  onMessage: (text: string) => void;
  onError: () => void;
};

export type FileBean = {
  uploadFileId: string;
  type: 'document' | 'image' | 'audio' | 'video' | 'custom';
};

export type QueryBo = {
  conversationId: string;
  query: string;
  chatContextId?: string;
  fingerprint: string;
  nickname: string;
  fileList: FileBean[];
};
export type SseEvent = {
  chatContextId: string;
  content: string;
  event:
    | 'error'
    | 'workflow_started'
    | 'node_started'
    | 'message'
    | 'node_finished'
    | 'workflow_finished'
    | 'message_end';
};
export type EmittedDrawerEvent = {
  action: 'open' | 'close';
};

export type FileDetail = {
  id: string;
  name: string;
  size: number;
  extension: string;
};
