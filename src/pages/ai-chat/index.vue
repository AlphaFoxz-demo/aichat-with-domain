<template>
  <page-meta
    :root-font-size="aiChatAgg.states.rootFontSize.value / 1.925 + 'px'"
  >
  </page-meta>
  <view class="affchat">
    <uni-drawer ref="showRight" mode="left" :mask-click="true">
      <DrawerContent />
    </uni-drawer>
    <view class="affchat-header" ref="headerRef" z-index="7">
      <view class="affchat-header-left">
        <view @click="showDrawer" class="affchat-header-drawerBtn">
          <view
            :style="{
              background: `no-repeat center center/100% 100% url(${DrawerIcon})`,
            }"
          ></view>
        </view>
      </view>
      <view class="affchat-header-right">
        <view class="affchat-header-elderlyBtn" @click="handleToogleElderMode">
          <view
            :style="{
              background: `no-repeat center center/100% 100% url(${ElderlyIcon(
                elderMode
              )})`,
            }"
          ></view>
        </view>
        <view class="affchat-header-newchatBtn" @click="handleNewChat">
          <view
            :style="{
              background: `no-repeat center center/100% 100% url(${NewChatIcon})`,
            }"
          ></view>
        </view>
      </view>
    </view>

    <view
      v-if="!aiChatAgg.states.currentConversationId.value"
      class="affchat-emptymain"
      :enable-flex="false"
    >
      <text class="mid-text">您好，欢迎体验智能客服</text>
      <text class="large-text">今天有什么可以帮到您？</text>
      <UserToolbar />
    </view>
    <scroll-view
      v-if="aiChatAgg.states.currentConversationId.value"
      class="affchat-main"
      scroll-y="true"
      :enhanced="true"
      :bounces="false"
      :enable-flex="false"
      :show-scrollbar="false"
      :style="{ marginBottom: aiChatAgg.states.userBarHeight.value }"
    >
      <template
        v-if="aiChatAgg.states.currentConversationId.value"
        v-for="message in aiChatAgg.states.conversationMap[
          aiChatAgg.states.currentConversationId.value
        ].content"
        :key="message.id"
      >
        <view
          :class="`affchat-main-node-wrapper ${
            message.creator === 'User'
              ? 'user-message-wrapper'
              : 'dp-message-wrapper'
          }`"
        >
          <view v-if="message.creator === 'DeepSeek'" class="dp-avatar"></view>

          <template v-for="messageNode in message.text" :key="messageNode">
            <view
              v-if="message.creator === 'DeepSeek'"
              class="affchat-main-node dp-message"
            >
              <view class="text">
                <text selectable>{{ messageNode }}</text>
              </view>
            </view>
            <view
              v-else-if="message.creator === 'User'"
              class="affchat-main-node user-message"
            >
              <template v-for="file in message.fileList" :key="file.id">
                <view class="affchat-main-node-filewrapper">
                  <view class="affchat-main-node-fileitem">
                    <view class="affchat-main-node-fileitem-fileinfo">
                      <text class="affchat-main-node-fileitem-fileinfo-name">
                        {{ file.name }}
                      </text>
                      <view class="affchat-main-node-fileitem-fileinfo-size">
                        {{ readableSize(file.size) }}
                      </view>
                    </view>
                  </view>
                </view>
              </template>
              <view class="text">
                <text selectable>{{ messageNode }}</text>
              </view>
            </view>
          </template>
          <view
            v-if="isRunningMessage(message)"
            class="affchat-main-node dp-message loading"
          ></view>
          <view
            v-if="message.text.length > 0 && message.status !== 'Failed'"
            @click="handleCopy(message.text)"
            class="affchat-main-copyBtn"
          >
            <view
              :style="{
                background: `no-repeat center center/100% 100% url(${CopyIcon})`,
              }"
            ></view
          ></view>
        </view>
      </template>

      <view style="width: 100%; height: 80rpx"></view>
    </scroll-view>

    <view
      v-if="aiChatAgg.states.currentConversationId.value"
      class="affchat-footer"
    >
      <UserToolbar />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onReady, onUnload } from '@dcloudio/uni-app';
import { computed, ref, type DeepReadonly } from 'vue';
import { useAiChatAgg } from './domain';
import type { ConversationMessage } from './domain/define';
import { aiChatQuery } from './api';
import DrawerContent from './components/DrawerContent.vue';
import DrawerIcon from './components/DrawerIcon';
import NewChatIcon from './components/NewChatIcon';
import ElderlyIcon from './components/ElderlyIcon';
import CopyIcon from './components/CopyIcon';
import UserToolbar from './components/UserToolbar.vue';
import { readableSize } from './domain/common';

uni.setNavigationBarTitle({ title: '智能客服' });
const aiChatAgg = useAiChatAgg();
console.debug(
  'currentConversationId',
  aiChatAgg.states.currentConversationId.value
);

onLoad(async () => {
  let nickname = 'weixin-unknown';
  try {
    const userInfo = await uni.getUserInfo().catch(() => {});
    nickname = userInfo?.userInfo?.nickName || 'weixin-unknown';
    console.debug('nickName', userInfo?.userInfo.nickName);
  } catch (e) {
    console.warn('getUserInfo', e);
  } finally {
    aiChatAgg.commands.setNickname(nickname);
  }
});

const showRight = ref();
const headerHeight = ref(0);
const footerHeight = ref(0);
const conversationHeight = computed(() => {
  return `calc(100% - ${headerHeight.value}px - ${footerHeight.value}px)`;
});
onReady(() => {
  uni
    .createSelectorQuery()
    .select('.affchat-header')
    .boundingClientRect()
    .exec((ret) => {
      ret[0] && (headerHeight.value = ret[0].height);
    });
  uni
    .createSelectorQuery()
    .select('.affchat-footer')
    .boundingClientRect()
    .exec((ret) => {
      ret[0] && (footerHeight.value = ret[0].height);
    });
  console.debug(
    conversationHeight.value,
    headerHeight.value,
    footerHeight.value
  );
});

// ===================== 执行查询 ======================
onUnload(
  aiChatAgg.events.onQueryStartedEvent.listen(({ data }) => {
    aiChatQuery(
      data,
      (event) => {
        if (event.event === 'workflow_started') {
          aiChatAgg.commands.setConversationContextId(
            data.conversationId,
            event.chatContextId
          );
          aiChatAgg.commands.conversationStartWorkflow(data.conversationId);
        } else if (event.event === 'workflow_finished') {
          aiChatAgg.commands.conversationFinishWorkflow(data.conversationId);
        } else if (event.event === 'node_started') {
          aiChatAgg.commands.conversationStartNode(data.conversationId);
        } else if (event.event === 'node_finished') {
          aiChatAgg.commands.conversationFinishNode(data.conversationId);
        } else if (event.event === 'message') {
          aiChatAgg.commands.conversationOnMessage(
            data.conversationId,
            event.content
          );
        } else if (event.event === 'error') {
          aiChatAgg.commands.conversationOnMessage(
            data.conversationId,
            data.fileList.length === 0 ? '请求异常' : '文件格式不支持'
          );
          aiChatAgg.commands.conversationOnError(data.conversationId);
          uni.showToast({
            title: data.fileList.length === 0 ? '请求异常' : '文件格式不支持',
            icon: 'error',
          });
        }
      },
      () => {
        aiChatAgg.commands.conversationFinishNode(data.conversationId);
      },
      () => {
        aiChatAgg.commands.conversationOnError(data.conversationId);
      }
    );
  })
);

// ===================== 老年人模式 ======================
const elderMode = ref(false);

// ===================== 侧面抽屉 ======================
onUnload(
  aiChatAgg.events.onDrawerOperatedEvent.listen(({ data }) => {
    if (data.action === 'close') {
      closeDrawer();
    } else if (data.action === 'open') {
      showDrawer();
    }
  })
);

function isRunningMessage(
  message: ConversationMessage | DeepReadonly<ConversationMessage>
): boolean {
  if (message.text.length === 0) {
    return true;
  }
  return !message.text.some((str) => str.trim().length > 0);
  // return message.status === 'Running';
}
function handleNewChat() {
  aiChatAgg.commands.switchConversationById(undefined);
}

function showDrawer() {
  showRight?.value.open();
}
function closeDrawer() {
  showRight?.value.close();
}
function handleToogleElderMode() {
  elderMode.value = !elderMode.value;
  if (elderMode.value) {
    aiChatAgg.commands.fontZoomIn();
  } else {
    aiChatAgg.commands.fontZoomOut();
  }
}
function handleCopy(text: string[] | DeepReadonly<string[]>) {
  uni.setClipboardData({
    data: text?.join('\n\n').trim() || '',
  });
}
</script>

<style lang="scss" scoped>
.affchat {
  width: 100%;
  height: 100%;

  &-header {
    display: grid;
    grid-template-columns: 50% 50%;
    z-index: 7;
    position: fixed;
    top: 0;
    height: 115.5rpx;
    width: 100%;
    background-color: #fff;

    &-left {
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    &-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    &-drawerBtn {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-left: 11.55rpx;
      height: 84.7rpx;
      width: 84.7rpx;
      view {
        width: 38.5rpx;
        height: 38.5rpx;
      }
    }
    &-drawerBtn:active {
      background-color: #f5f5f5;
    }
    &-elderlyBtn {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 11.55rpx;
      height: 84.7rpx;
      width: 84.7rpx;
      view {
        width: 38.5rpx;
        height: 38.5rpx;
      }
    }
    &-elderlyBtn:active {
      background-color: #f5f5f5;
    }
    &-newchatBtn {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 11.55rpx;
      height: 84.7rpx;
      width: 84.7rpx;
      view {
        width: 38.5rpx;
        height: 38.5rpx;
      }
    }
    &-newchatBtn:active {
      background-color: #f5f5f5;
    }
  }
  &-emptymain {
    width: calc(100% - 100rpx);
    padding: 115.5rpx 50rpx 240rpx 50rpx;
    height: calc(100vh - 354rpx);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text {
      font-size: 1.05rem;
      font-weight: bold;
      color: #0f1115;
      margin-bottom: 61.6rpx;
      white-space: nowrap;
    }
  }
  &-main {
    width: calc(100% - 100rpx);
    height: calc(100vh - 360rpx);
    padding: 115.5rpx 50rpx 240rpx 50rpx;
    display: block;
    overflow-y: scroll;
    transition: padding 0.2s;

    &-node-wrapper.user-message-wrapper {
      align-items: flex-end;
      display: flex;
      flex-direction: column;
    }
    &-node-wrapper.dp-message-wrapper {
      position: relative;
    }
    &-node {
      margin: 30.8rpx 0;
      font-size: 1rem;
      text {
        overflow-wrap: break-word;
        white-space: pre-wrap;
        line-height: 46.2rpx;
      }
    }
    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    &-node.dp-message.loading {
      width: 71.5rpx;
      height: 71.5rpx;
      background: no-repeat center center/100% 100%
        url(@/static/aichat-loading.png);
      animation: rotate 0.8s linear infinite;
    }
    &-node.user-message {
      text-align: right;
      .text {
        display: inline-block;
        background-color: rgb(237, 243, 254);
        padding: 19.25rpx 30.8rpx;
        border-radius: 48rpx;
      }
    }
    &-node-filewrapper {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      margin: 19.25rpx;
    }
    &-node-fileitem {
      display: grid;
      grid-template-columns: 385rpx 26.95rpx;
      border-color: rgb(232, 232, 232);
      border-style: solid;
      border-width: 1px;
      border-radius: 30rpx;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.04);
      background-color: unset;
      padding: 19.25rpx 30.8rpx;
      font-size: 1.136rem;
      font-weight: normal;
      &-fileinfo {
        display: flex;
        flex-direction: column;
        text-align: right;
        &-name {
          color: #0f1115;
          max-width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-weight: bold;
          font-size: 0.875rem;
        }
        &-size {
          color: #81858c;
          font-size: 0.75rem;
        }
      }
    }
    &-copyBtn {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-right: 11.55rpx;
      height: 1.75rem;
      width: 1.75rem;
      opacity: 0.7;
      view {
        width: 1rem;
        height: 1rem;
      }
    }
  }
  &-footer {
    z-index: 50;
    position: fixed;
    display: flex;
    bottom: 25rpx;
    flex-direction: column;
    align-items: center;
    width: calc(100% - 62rpx);
    min-height: 200rpx;
    padding: 0 31rpx;
  }
}
</style>
