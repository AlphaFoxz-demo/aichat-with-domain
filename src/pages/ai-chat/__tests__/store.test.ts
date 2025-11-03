import { describe, expect, it } from 'vitest';
import { useAiChatAgg } from '../domain';
import type { EmittedDrawerEvent, FileBean } from '../domain/define'
import { watch } from 'vue';

function finalApply(handle: Function) {
  return {
    [Symbol.dispose]() {
      if (!!handle) {
        handle();
      }
    },
  };
}

describe('store', () => {
  it('query', async () => {
    const store = useAiChatAgg();
    let gotConversationId: string | undefined = undefined;
    let gotQuery: string | undefined = undefined;
    let gotFingerprint: string | undefined = undefined;
    let gotFileList: readonly FileBean[] | undefined = undefined;
    store.commands.setNickname('微信用户');
    store.commands.addFile({
      id: '1',
      name: '我的文件.pdf',
      extension: 'pdf',
      size: 6387,
    });
    using _w = finalApply(store.events.onQueryStartedEvent.listen(
      ({ data }) => {
        gotConversationId = data.conversationId;
        gotQuery = data.query;
        gotFingerprint = data.fingerprint;
        gotFileList = data.fileList;
      }
    ));
    store.commands.query('介绍这个文件');
    await Promise.resolve();
    expect(gotConversationId!.length).toBeGreaterThan(0);
    expect(gotQuery).toBe('介绍这个文件');
    expect(gotFingerprint).toBe('微信用户');
    expect(gotFileList!.length).toBe(1);
    expect(gotFileList![0]).toEqual({
      type: 'document',
      uploadFileId: '1'
    });
  });

  it('drawer control', async () => {
    const agg = useAiChatAgg();
    let gotEvent: EmittedDrawerEvent | undefined = undefined;
    using _w = finalApply(
      agg.events.onDrawerOperatedEvent.listen(({ data }) => {
        gotEvent = data;
      })
    )
    agg.commands.closeDrawer();
    await Promise.resolve();
    expect(gotEvent!.action).toBe('close');
  })
});
