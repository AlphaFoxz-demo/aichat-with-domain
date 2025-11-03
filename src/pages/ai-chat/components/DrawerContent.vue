<template>
  <view class="affchat-drawer">
    <view class="affchat-drawer-header1">
      <view class="affchat-drawer-header1-left">
        <view class="affchat-drawer-header1-title">智能客服</view>
      </view>
      <view class="affchat-drawer-header1-right">
        <view
          @click="handleCloseDrawer"
          class="affchat-drawer-header1-closeBtn"
        >
          <view
            :style="{
              background: `no-repeat center center/100% 100% url(${DrawerCloseIcon})`,
            }"
          ></view>
        </view>
      </view>
    </view>
    <view class="affchat-drawer-header2" @click="handleNewChat">
      <view
        class="affchat-drawer-header2-newchat"
        :style="{
          background: `no-repeat center center/100% 100% url(${NewChatIcon})`,
        }"
      >
      </view>
      <view>开启新对话</view>
    </view>
    <scroll-view
      v-if="Object.keys(aiChatStore.states.conversationMap).length === 0"
      class="affchat-drawer-content"
      :scroll-y="true"
    >
      <view class="affchat-drawer-content-noitem">
        <view
          :style="{
            background: `no-repeat center center/100% 100% url(${NoChatIcon})`,
          }"
        ></view>
        <text>暂无历史对话</text>
      </view>
    </scroll-view>
    <scroll-view v-else class="affchat-drawer-content" :scroll-y="true">
      <template
        v-for="conversationId in Object.keys(
          aiChatStore.states.conversationMap
        )"
        :key="conversationId"
      >
        <view
          @click="handleSwitchConversation(conversationId)"
          :class="`affchat-drawer-content-item ${
            aiChatStore.states.currentConversationId.value === conversationId
              ? 'active'
              : ''
          }`"
        >
          <text>
            {{ aiChatStore.states.conversationMap[conversationId].title }}
          </text>
          <view
            v-if="
              aiChatStore.states.currentConversationId.value === conversationId
            "
            @click="handleDeleteConversation(conversationId)"
            class="affchat-drawer-content-delBtn"
          >
            删除
          </view>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script lang="ts">
export default {
  options: {
    virtualHost: true,
  },
};
</script>
<script setup lang="ts">
import { useAiChatAgg } from '../domain';
import DrawerCloseIcon from './DrawerCloseIcon';
import NewChatIcon from './NewChatIcon';
import NoChatIcon from './NoChatIcon';

const aiChatStore = useAiChatAgg();

function handleDeleteConversation(conversationId: string) {
  uni.showModal({
    title: '提示',
    content: '确定删除当前对话吗?',
    confirmText: '删除',
    confirmColor: '#ff0000',
    success: function (res) {
      if (res.confirm) {
        aiChatStore.commands.deleteConversationById(conversationId);
      }
    },
  });
}
function handleSwitchConversation(conversationId: string) {
  aiChatStore.commands.switchConversationById(conversationId);
  aiChatStore.commands.closeDrawer();
}
function handleCloseDrawer() {
  aiChatStore.commands.closeDrawer();
}
function handleNewChat() {
  aiChatStore.commands.switchConversationById(undefined);
  aiChatStore.commands.closeDrawer();
}
</script>

<style lang="scss">
.affchat-drawer {
  height: calc(100% - 23.1rpx);
  width: calc(100% - 46.2rpx);
  margin: 11.55rpx 23.1rpx;

  &-header1 {
    display: grid;
    grid-template-columns: 1fr 65.45rpx;
    width: 100%;
    height: 92.4rpx;
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
    &-bottom {
      font-size: 1.169rem;
      color: #333;
      font-weight: 600;
    }
    &-title {
      font-size: 1.25rem;
      font-weight: bold;
      color: #555;
    }
    &-closeBtn {
      width: 65.45rpx;
      height: 65.45rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      view {
        width: 30.8rpx;
        height: 30.8rpx;
      }
    }
  }
  &-header2 {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 77rpx;
    font-size: 0.875rem;
    border: 1px solid rgba(103, 158, 254, 0);
    box-shadow: 0 -2px 2px rgba(72, 104, 178, 0.06),
      0 2px 2px rgba(106, 111, 117, 0.12), 0 1px 2px rgba(72, 104, 178, 0.12);
    border-radius: 38.5rpx;

    view {
      font-size: 0.875rem;
      font-weight: bold;
    }
    &-newchat {
      width: 30.8rpx;
      height: 30.8rpx;
      margin-right: 10rpx;
    }
  }

  &-content {
    margin-top: 30rpx;
    height: calc(100% - 202.4rpx);
    &-item {
      display: grid;
      grid-template-columns: 1fr 53.9rpx;
      font-size: 0.875rem;
      border-radius: 25.55rpx;
      height: 53.9rpx;
      padding: 11.55rpx 17.325rpx;
      color: #0f1115;
      text {
        line-height: 53.9rpx;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 100%;
        overflow: hidden;
      }
      view {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: unset;
        border-radius: 50%;
      }
      view:active {
        background-color: rgb(217, 226, 242);
      }
    }
    &-item.active {
      background-color: rgb(228, 237, 253);
      color: #3964fe;
    }
    &-delBtn {
      font-size: 28rpx;
      white-space: nowrap;
      color: #ff0000;
    }
    &-noitem {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: calc(100% - 30.8rpx);
      padding-bottom: 30.8rpx;
      font-size: 0.75rem;
      color: #81858c;
      view {
        width: 38.5rpx;
        height: 38.5rpx;
        margin: 10rpx;
      }
    }
  }
}
.drawer-contextmenu {
  position: fixed;
}
</style>
