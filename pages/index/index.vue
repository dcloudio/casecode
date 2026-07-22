<template>
  <view class="pages">
    <view class="page-scene">
      <image class="hero-image" src="/static/index/index-header.png" mode="widthFix" draggable="false"></image>

      <view class="content-shell">
        <view class="riddle-card">
          <image class="riddle-plaque" src="/static/index/index-t.png" mode="widthFix" draggable="false"></image>

          <view class="question-area">
            <view class="question-lines">
              <text v-for="(line, lineIndex) in questionLines" :key="lineIndex" class="question-line">{{ line }}</text>
            </view>
          </view>

          <view class="riddle-meta">
            <view class="meta-row">
              <view class="meta-item">
                <text class="meta-label">类型</text>
                <text class="meta-value">{{ currentRiddle.category }}</text>
              </view>
              <view class="meta-item meta-item-answer">
                <text class="meta-label">答案</text>
                <text class="meta-value">{{ answerLength }}个字</text>
              </view>
            </view>
            <view class="stats-row">
              <view class="stat-item">
                <view class="stat-heading">
                  <uni-icons type="medal" size="16" color="#df8b2f"></uni-icons>
                  <text class="stat-label">难度</text>
                </view>
                <text class="stat-value">{{ currentRiddle.difficulty }}</text>
              </view>
              <view class="stat-item">
                <view class="stat-heading">
                  <uni-icons type="list" size="16" color="#df8b2f"></uni-icons>
                  <text class="stat-label">答题进度</text>
                </view>
                <text class="stat-value">{{ currentIndex + 1 }}/{{ totalRiddles }}</text>
              </view>
              <view class="stat-item">
                <view class="stat-heading">
                  <uni-icons type="refresh" size="16" color="#df8b2f"></uni-icons>
                  <text class="stat-label">尝试次数</text>
                </view>
                <text class="stat-value">{{ attemptCount }}次</text>
              </view>
            </view>
          </view>
        </view>

        <view class="answer-panel" :class="{ 'answer-panel-revealed': showAnswer || isAnswerCorrect }">
          <view class="answer-heading">
            <view class="heading-rule"></view>
            <text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
            <text class="answer-heading-text">{{ showAnswer || isAnswerCorrect ? '谜底揭晓' : '请输入你的答案' }}</text>
            <text class="heading-ornament" aria-hidden="true">❧</text>
            <view class="heading-rule"></view>
          </view>

          <template v-if="!showAnswer && !isAnswerCorrect">
            <view class="answer-input-wrap">
              <input
                v-model="userAnswer"
                class="answer-input"
                placeholder="在此输入你的答案..."
                placeholder-style="color: #c9c1ba; font-size: 15px;"
                :maxlength="answerLength + 2"
                confirm-type="done"
                @confirm="checkAnswer"
              />
              <uni-icons class="input-icon" type="compose" size="22" color="#bdb4ac"></uni-icons>
            </view>

            <button class="art-button submit-button" hover-class="art-button-pressed" aria-label="提交答案" @click="checkAnswer">
              <image class="submit-button-image" src="/static/index/index-btn1.png" mode="widthFix"></image>
            </button>

            <button class="art-button ad-button" hover-class="art-button-pressed" aria-label="看广告解锁答案" @click="watchAdForAnswer">
              <image class="ad-button-image" src="/static/index/index-btn2.png" mode="widthFix"></image>
            </button>
          </template>

          <view v-else class="revealed-actions">
            <view class="answer-result">
              <text class="answer-result-label">{{ isAnswerCorrect ? '恭喜答对' : '正确答案' }}</text>
              <text class="answer-result-value">{{ currentRiddle.answer }}</text>
            </view>
            <button class="next-button" hover-class="next-button-pressed" @click="nextRiddle">
              <text class="next-button-text">下一题</text>
              <uni-icons type="right" size="19" color="#ffffff"></uni-icons>
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import riddleData from '@/data/riddles.js';
  import AD from '@/utils/ad.js';
  import { store } from '@/uni_modules/uni-id-pages/common/store.js';

  export default {
    data() {
      return {
        riddles: riddleData,
        currentIndex: 0,
        showAnswer: false,
        userAnswer: '',
        isAnswerCorrect: false,
        attemptCount: 0,
      };
    },
    computed: {
      currentRiddle() {
        return this.riddles[this.currentIndex] || {};
      },
      questionLines() {
        const question = this.currentRiddle.question || '';
        return question.match(/[^，。！？；,.!?;]+[，。！？；,.!?;]?/g) || [question];
      },
      answerLength() {
        return Array.from(this.currentRiddle.answer || '').length;
      },
      totalRiddles() {
        return this.riddles.length;
      },
    },
    onLoad(options) {
      console.log('options', options);
      // 如果有 uniInvitationCode 就记录到storage中
      if (options.uniInvitationCode) {
        uni.setStorageSync('sf-invitation-code', options.uniInvitationCode);
      }

      // 随机打乱谜语顺序，增加趣味性
      this.shuffleRiddles();
    },
    methods: {
      // 随机打乱谜语顺序
      shuffleRiddles() {
        for (let i = this.riddles.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.riddles[i], this.riddles[j]] = [this.riddles[j], this.riddles[i]];
        }
      },

      // 校验登录，未登录则跳转登录页
      requireLogin() {
        if (!store.hasLogin) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          });
          const redirectUrl = '/pages/index/index';
          uni.navigateTo({
            url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd?uniIdRedirectUrl=' + encodeURIComponent(redirectUrl),
          });
          return false;
        }
        return true;
      },

      // 验证答案
      checkAnswer() {
        if (!this.requireLogin()) return;

        const trimmedAnswer = this.userAnswer?.trim();

        if (!trimmedAnswer) {
          uni.showToast({
            title: '请输入答案',
            icon: 'none',
          });
          return;
        }

        this.attemptCount++;

        // 验证答案（去除空格，不区分大小写）
        if (trimmedAnswer === this.currentRiddle.answer) {
          this.isAnswerCorrect = true;
          uni.showToast({
            title: '回答正确！',
            icon: 'success',
          });
        } else {
          uni.showToast({
            title: '答案不对，再想想吧',
            icon: 'none',
          });
          // 震动反馈
          uni.vibrateShort({
            success: () => {},
          });
        }
      },

      // 观看广告查看答案
      watchAdForAnswer() {
        if (!this.requireLogin()) return;

        const userId = uniCloud.getCurrentUserInfo().uid;
        console.log('watchAdForAnswer 用户ID:', userId);
        AD.showRewardedAd({
          urlCallback: {
            userId,
            extra: {
              action: 'watchAdForAnswer',
            },
          },
          onSuccess: () => {
            // 广告播放完成，显示答案
            this.showAnswer = true;
            uni.showToast({
              title: '感谢观看！',
              icon: 'success',
            });
            // 标记商城页需要重新拉取积分
            getApp().globalData.pointsNeedRefresh = true;
          },
          cancelMessage: '请完整观看广告才能查看答案',
        });
      },

      // 重置当前题目状态
      resetCurrentQuestion() {
        this.userAnswer = '';
        this.showAnswer = false;
        this.isAnswerCorrect = false;
        this.attemptCount = 0;
      },

      // 下一题
      nextRiddle() {
        if (this.currentIndex < this.totalRiddles - 1) {
          this.currentIndex++;
          this.resetCurrentQuestion();
        } else {
          uni.showToast({
            title: '已经是最后一题了',
            icon: 'none',
          });
        }
      },

      // 上一题
      prevRiddle() {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          this.resetCurrentQuestion();
        } else {
          uni.showToast({
            title: '已经是第一题了',
            icon: 'none',
          });
        }
      },
    },
  };
</script>

<style scoped>
  view,
  text,
  button,
  input,
  image {
    box-sizing: border-box;
    letter-spacing: 0;
  }

  .pages {
    min-height: 100vh;
    background: #f7e4b9;
    color: #4b170d;
  }

  .page-scene {
    width: 100%;
    max-width: 430px;
    min-height: 100vh;
    margin: 0 auto;
    overflow: hidden;
    background-color: #fae8be;
    background-repeat: no-repeat;
    background-position: center top;
    background-size: 100% auto;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }

  .hero-image {
    display: block;
    width: 100%;
    height: auto;
    flex-shrink: 0;
  }

  .content-shell {
    position: relative;
    z-index: 1;
    width: 100%;
    margin-top: -25.35vw;
    padding: 0 4vw;
  }

  .riddle-card,
  .answer-panel {
    position: relative;
    width: 100%;
    background: #fffaf0;
    border: 2px solid #efb45c;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.94), inset 0 0 0 4px rgba(218, 151, 58, 0.26), 0 8px 18px rgba(134, 76, 24, 0.2);
  }

  .answer-panel-revealed {
    display: flex;
    flex-direction: column;
  }

  .riddle-card {
    min-height: 343px;
    padding: 42px 14px 12px;
    border-radius: 24px;
  }

  .riddle-card::before,
  .answer-panel::before {
    position: absolute;
    top: 8px;
    right: 8px;
    bottom: 8px;
    left: 8px;
    z-index: 0;
    border: 1px solid rgba(225, 169, 90, 0.35);
    border-radius: 17px;
    content: '';
    pointer-events: none;
  }

  .riddle-plaque {
    position: absolute;
    top: -45px;
    left: 50%;
    z-index: 2;
    width: 44%;
    max-width: 160px;
    height: auto;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .question-area,
  .riddle-meta,
  .answer-heading,
  .answer-input-wrap,
  .art-button,
  .answer-result,
  .next-button {
    position: relative;
    z-index: 1;
  }

  .question-area {
    display: flex;
    min-height: 163px;
    align-items: center;
    justify-content: center;
    padding: 2px 0 8px;
  }

  .question-lines {
    display: flex;
    max-width: 280px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .question-line {
    display: block;
    max-width: 100%;
    color: #41170f;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
    font-size: 23px;
    font-weight: 700;
    line-height: 1.58;
    text-align: center;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
    word-break: break-all;
  }

  .riddle-meta {
    border-top: 1px solid rgba(207, 156, 92, 0.18);
  }

  .meta-row {
    display: flex;
    height: 54px;
    flex-direction: row;
    align-items: center;
    padding: 0 18px;
  }

  .meta-item {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: row;
    align-items: center;
  }

  .meta-item-answer {
    justify-content: flex-end;
  }

  .meta-label,
  .meta-value {
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
    font-size: 16px;
  }

  .meta-label {
    flex-shrink: 0;
    margin-right: 12px;
    color: #53190e;
    font-weight: 700;
  }

  .meta-value {
    color: #541d14;
    font-weight: 500;
  }

  .stats-row {
    display: flex;
    height: 66px;
    flex-direction: row;
    align-items: stretch;
    border-top: 1px dashed rgba(211, 146, 68, 0.28);
  }

  .stat-item {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .stat-item + .stat-item {
    border-left: 1px solid rgba(222, 155, 71, 0.35);
  }

  .stat-heading {
    display: flex;
    min-width: 0;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  .stat-label {
    margin-left: 4px;
    color: #7b4c2e;
    font-size: 12px;
    line-height: 18px;
    white-space: nowrap;
  }

  .stat-value {
    margin-top: 3px;
    color: #5a2318;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 19px;
  }

  .answer-panel {
    min-height: 277px;
    margin-top: 18px;
    padding: 15px 14px 10px;
    border-color: rgba(255, 255, 255, 0.92);
    border-radius: 22px;
    background: #fffaf2;
    box-shadow: inset 0 0 0 2px rgba(234, 184, 106, 0.28), 0 7px 18px rgba(132, 73, 20, 0.16);
  }

  .answer-panel::before {
    border-color: rgba(229, 177, 99, 0.22);
  }

  .answer-heading {
    display: flex;
    height: 26px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    padding: 0 17px;
  }

  .answer-heading-text {
    flex-shrink: 0;
    margin: 0 5px;
    color: #4d190f;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
    font-size: 17px;
    font-weight: 700;
    line-height: 26px;
  }

  .heading-rule {
    height: 1px;
    min-width: 15px;
    flex: 1;
    background: linear-gradient(90deg, transparent, #dda143);
  }

  .heading-rule:last-child {
    background: linear-gradient(90deg, #dda143, transparent);
  }

  .heading-ornament {
    display: block;
    flex-shrink: 0;
    color: #dda143;
    font-family: Georgia, serif;
    font-size: 19px;
    line-height: 20px;
  }

  .heading-ornament-left {
    transform: scaleX(-1);
  }

  .answer-input-wrap {
    display: flex;
    height: 52px;
    flex-direction: row;
    align-items: center;
    padding: 0 14px;
    border: 1px solid rgba(222, 183, 147, 0.55);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: inset 0 2px 5px rgba(117, 70, 36, 0.05);
  }

  .answer-input-wrap:focus-within {
    border-color: rgba(214, 137, 43, 0.72);
    box-shadow: inset 0 2px 5px rgba(117, 70, 36, 0.04), 0 0 0 2px rgba(232, 166, 74, 0.15);
  }

  .answer-input {
    height: 100%;
    min-width: 0;
    flex: 1;
    color: #4b2118;
    font-size: 16px;
    line-height: 52px;
  }

  .input-icon {
    flex-shrink: 0;
    margin-left: 10px;
  }

  .art-button {
    display: block;
    width: 100%;
    margin: 0;
    overflow: hidden;
    border: 0;
    border-radius: 14px;
    background: transparent;
    box-shadow: none;
    transition: transform 120ms ease, opacity 120ms ease;
  }

  .art-button::after,
  .next-button::after {
    border: 0;
  }

  .art-button-pressed,
  .next-button-pressed {
    opacity: 0.92;
    transform: scale(0.985);
  }

  .submit-button {
    height: 18.25vw;
    max-height: 79px;
    margin-top: 13px;
  }

  .ad-button {
    height: 17.5vw;
    max-height: 75px;
    margin-top: 12px;
  }

  .submit-button-image,
  .ad-button-image {
    position: absolute;
    left: -4.5%;
    width: 109%;
    height: auto;
    pointer-events: none;
  }

  .submit-button-image {
    top: -5.82vw;
  }

  .ad-button-image {
    top: -5.55vw;
  }

  .answer-result {
    display: flex;
    height: 82px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(220, 157, 74, 0.42);
    border-radius: 13px;
    background: rgba(255, 248, 229, 0.84);
  }

  .revealed-actions {
    position: relative;
    z-index: 1;
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    padding-bottom: 4px;
  }

  .answer-result-label {
    margin-bottom: 4px;
    color: #a65520;
    font-size: 13px;
    font-weight: 600;
  }

  .answer-result-value {
    color: #581b0e;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
    font-size: 27px;
    font-weight: 700;
  }

  .next-button {
    display: flex;
    height: 51px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin: 10px 0 0;
    border: 1px solid #f4c06b;
    border-radius: 14px;
    background: linear-gradient(180deg, #2497f5 0%, #0752d6 77%, #0641bd 100%);
    box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.48), 0 3px 7px rgba(14, 67, 174, 0.28);
    transition: transform 120ms ease, opacity 120ms ease;
  }

  .next-button-text {
    margin-right: 2px;
    color: #ffffff;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
    font-size: 21px;
    font-weight: 700;
    text-shadow: 0 2px 2px rgba(0, 48, 139, 0.42);
  }

  @media screen and (min-width: 430px) {
    .content-shell {
      margin-top: -109px;
      padding-right: 17px;
      padding-left: 17px;
    }

    .submit-button-image {
      top: -25px;
    }

    .ad-button-image {
      top: -24px;
    }
  }
</style>
