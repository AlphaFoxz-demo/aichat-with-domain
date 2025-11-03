<template>
  <view class="affchat-footer-panel">
    <scroll-view :scroll-y="true" class="affchat-footer-inputbox">
      <template v-for="file in aiChatAgg.states.currentFileList" :key="file.id">
        <view class="affchat-footer-fileitem">
          <view class="affchat-footer-fileitem-fileinfo">
            <text class="affchat-footer-fileitem-fileinfo-name">
              {{ file.name }}
            </text>
            <view class="affchat-footer-fileitem-fileinfo-size">
              {{ readableSize(file.size) }}
            </view>
          </view>
          <view
            class="affchat-footer-fileitem-closeBtn"
            @click="handleRemoveFile(file)"
          >
            <view>×</view>
          </view>
        </view>
      </template>
      <textarea
        v-model="inputValue"
        :auto-height="true"
        class="affchat-footer-queryinput"
        placeholder="给智能客服发送信息"
        placeholder-style="font-size: 1rem!important"
        cursor-spacing="35"
        :maxlength="-1"
        @keypress.enter="handleQuery"
        @linechange="handleResize"
      ></textarea>
    </scroll-view>
    <view class="affchat-footer-toolbarmask"></view>
    <view class="affchat-footer-toolbar">
      <view class="affchat-footer-toolbar-left"></view>
      <view class="affchat-footer-toolbar-right">
        <view
          @click="handleUploadFile"
          class="affchat-footer-toolbar-documentBtn"
        >
          <view
            :style="{
              background: `no-repeat center center/100% 100% url(${DocumentIcon})`,
            }"
          ></view>
        </view>
        <view @click="handleQuery" class="affchat-footer-toolbar-sendBtn">
          <view
            :style="{
              background: `no-repeat center center/100% 100% url(${SendIconSrc})`,
            }"
          ></view>
        </view>
      </view>
    </view>
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
import { nextTick, ref } from 'vue';
import { useAiChatAgg } from '../domain';
import SendIconSrc from './SendIcon';
import DocumentIcon from './DocumentIcon';
import type { FileDetail } from '../domain/define';
import { readableSize } from '../domain/common';

const aiChatAgg = useAiChatAgg();

const inputValue = ref(``);
function handleUploadFile() {
  //#ifdef H5
  uni.chooseFile({
    count: 1,
    extension: ['.doc,.xlsx,.docx'],
    success: (res) => {
      aiChatAgg.commands.showLoading('上传中...');
      console.debug('chooseFile', res);
      uni.uploadFile({
        url: `/api/upload`,
        filePath: res.tempFilePaths[0],
        name: 'file',
        formData: {
          fingerprint: aiChatAgg.states.nickname.value,
          nickname: aiChatAgg.states.nickname.value,
          originName: (res.tempFiles as any)[0].path,
        },
        success: (res) => {
          aiChatAgg.commands.hideLoading();
          console.debug('uploadFile', res);
          const record = JSON.parse(res.data);
          aiChatAgg.commands.addFile({
            id: record.id,
            name: record.name,
            extension: record.extension,
            size: record.size,
          });
        },
        fail: (res) => {
          aiChatAgg.commands.hideLoading();
          nextTick(() => {
            aiChatAgg.commands.showToast(`上传失败:${res.errMsg}`);
            setTimeout(() => {
              aiChatAgg.commands.hideToast();
            }, 3000);
          });
          uni.hideToast();
        },
      });
    },
  });
  //#endif
  //#ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1, //默认100
    success: (res) => {
      aiChatAgg.commands.showLoading('上传中...');
      console.debug('chooseFile', res);
      uni.uploadFile({
        url: `/api/upload`,
        filePath: res.tempFiles[0].path,
        name: 'file',
        formData: {
          fingerprint: aiChatAgg.states.nickname.value,
          nickname: aiChatAgg.states.nickname.value,
          originName: res.tempFiles[0].name,
        },
        success: (res) => {
          aiChatAgg.commands.hideLoading();
          console.debug('uploadFile', res);
          const record = JSON.parse(res.data);
          aiChatAgg.commands.addFile({
            id: record.id,
            name: record.name,
            extension: record.extension,
            size: record.size,
          });
        },
        fail: (res) => {
          aiChatAgg.commands.hideLoading();
          nextTick(() => {
            aiChatAgg.commands.showToast(`上传失败:${res.errMsg}`);
            setTimeout(() => {
              aiChatAgg.commands.hideToast();
            }, 3000);
          });
          uni.hideToast();
        },
      });
    },
  });
  //#endif
  //#ifdef APP-VUE
  //在这里导入打开安卓app本地文件选择器的封装方法
  // XXX
  // this.$common.androidChooseFile((res) => {
  //   var tempFiles = res;
  //   uni.uploadFile({
  //     url: this.$BASE_URL + 'api/uploads/upload',
  //     filePath: tempFiles,
  //     name: 'file',
  //     success: (res) => {},
  //   });
  // }, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  // #endif
}
function handleQuery() {
  const v = inputValue.value.trim();
  if (!v) {
    return;
  }
  aiChatAgg.commands.query(v);
  inputValue.value = '';
}
function handleRemoveFile(file: FileDetail) {
  aiChatAgg.commands.removeFile(file);
}
type ResizeEvent = Event & { detail: { height: number } };
function handleResize(event: ResizeEvent) {
  aiChatAgg.commands.setUserBarHeight(event.detail.height);
  console.debug(event.detail.height);
}
</script>

<style scoped lang="scss">
.affchat-footer {
  width: 100%;

  &-panel {
    position: relative;
    background-color: #fff;
    border-radius: 42rpx;
    border-color: rgb(232, 232, 232);
    border-style: solid;
    border-width: 1px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.04);
    min-height: 200rpx;
    max-height: 758.45rpx;
    width: 100%;
  }

  &-inputbox {
    width: 100%;
    height: 100%;
    max-height: 646.8rpx;
    // max-height: 825.825rpx;
    overflow-y: hidden;
    padding: 27rpx 0 0;
  }

  &-queryinput {
    display: inline-block;
    min-height: 57.75rpx;
    height: 57.75rpx;
    width: calc(100% - 62rpx);
    padding: 0 23rpx 11.55rpx 35rpx;
    font-size: 1rem;
    overflow-y: hidden;
    transition: height 0.2s;
  }

  &-toolbarmask {
    position: relative;
    width: 100%;
    height: 112rpx;
    background-color: unset;
    border-style: unset;
  }
  &-toolbar {
    position: absolute;
    bottom: 0;
    display: flex;
    width: 100%;
    height: 112rpx;
    background-color: #fff;
    z-index: 10;
    border-radius: 0 0 42rpx 42rpx;

    &-left {
      width: 50%;
      height: 100%;
    }
    &-right {
      width: 50%;
      height: 100%;
      margin-left: auto;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
    &-documentBtn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 65.5rpx;
      height: 65.5rpx;
      border-radius: 50%;
      margin-right: 23.1rpx;
      view {
        width: 30.8rpx;
        height: 30.8rpx;
      }
    }
    &-sendBtn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 65.5rpx;
      height: 65.5rpx;
      border-radius: 50%;
      margin-right: 23.1rpx;
      background-color: #3964fe;
      view {
        width: 30.8rpx;
        height: 30.8rpx;
      }
    }
  }

  &-fileitem {
    display: grid;
    grid-template-columns: 385rpx 26.95rpx;
    border-color: rgb(232, 232, 232);
    border-style: solid;
    border-width: 1px;
    border-radius: 30rpx;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.04);
    padding: 19.25rpx 30.8rpx;
    margin: 0 150rpx 23.1rpx 23.1rpx;
    font-size: 1.136rem;
    font-weight: normal;
    &-fileinfo {
      display: flex;
      flex-direction: column;
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
    &-closeBtn {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ff0000;
    }
  }
}
</style>
