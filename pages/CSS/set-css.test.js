// uni-app自动化测试教程: uni-app自动化测试教程: https://uniapp.dcloud.net.cn/worktile/auto/hbuilderx-extension/

jest.setTimeout(50000);

// CSS setProperty 测试配置数组
const cssTests = [
  {
    path: '/pages/CSS/layout/width',
    method: 'radioChangeWidth',
    valueIndex: 3,
    styleName: 'width',
    expectedValue: '50px'
  },
  {
    path: '/pages/CSS/layout/min-width',
    method: 'radioChangeMinWidth',
    valueIndex: 4,
    styleName: 'min-width',
    expectedValue: '120px'
  },
  {
    path: '/pages/CSS/layout/max-width',
    method: 'radioChangeMaxWidth',
    valueIndex: 4,
    styleName: 'max-width',
    expectedValue: '120px'
  },
  {
    path: '/pages/CSS/layout/height',
    method: 'radioChangeHeight',
    valueIndex: 4,
    styleName: 'height',
    expectedValue: '150px'
  },
  {
    path: '/pages/CSS/layout/min-height',
    method: 'radioChangeMinHeight',
    valueIndex: 3,
    styleName: 'min-height',
    expectedValue: '50px'
  },
  {
    path: '/pages/CSS/layout/max-height',
    method: 'radioChangeMaxHeight',
    valueIndex: 3,
    styleName: 'max-height',
    expectedValue: '100px'
  },
  {
    path: '/pages/CSS/layout/opacity',
    method: 'radioChangeOpacity',
    valueIndex: 3,
    styleName: 'opacity',
    expectedValue: '0.5'
  },
  {
    path: '/pages/CSS/layout/visibility',
    method: 'radioChangeVisibility',
    valueIndex: 2,
    styleName: 'visibility',
    expectedValue: 'hidden'
  },
  {
    path: '/pages/CSS/layout/top',
    method: 'radioChangeTop',
    valueIndex: 4,
    styleName: 'top',
    expectedValue: '10px'
  },
  {
    path: '/pages/CSS/layout/bottom',
    method: 'radioChangeBottom',
    valueIndex: 4,
    styleName: 'bottom',
    expectedValue: '10px'
  },
  {
    path: '/pages/CSS/layout/left',
    method: 'radioChangeLeft',
    valueIndex: 4,
    styleName: 'left',
    expectedValue: '10px'
  },
  {
    path: '/pages/CSS/layout/right',
    method: 'radioChangeRight',
    valueIndex: 4,
    styleName: 'right',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/layout/position',
    method: 'radioChangePosition',
    valueIndex: 2,
    styleName: 'position',
    expectedValue: 'relative'
  },
  {
    path: '/pages/CSS/layout/z-index',
    method: 'radioChangeZIndex',
    valueIndex: 4,
    styleName: 'z-index',
    expectedValue: '10'
  },
  // background
  {
    path: '/pages/CSS/background/background-color',
    method: 'radioChangeBackgroundColor',
    valueIndex: 3,
    styleName: 'background-color',
    expectedValue: 'rgb(255, 0, 0)'
  },
  // border
  {
    path: '/pages/CSS/border/border-bottom',
    method: 'radioChangeBorderBottom',
    valueIndex: 3,
    styleName: 'border-bottom',
    expectedValue: '2px dashed blue'
  },
  {
    path: '/pages/CSS/border/border-color',
    method: 'radioChangeBorderColor',
    valueIndex: 2,
    styleName: 'border-color',
    expectedValue: '#ff0000'
  },
  {
    path: '/pages/CSS/border/border-left',
    method: 'radioChangeBorderLeft',
    valueIndex: 3,
    styleName: 'border-left',
    expectedValue: '2px dashed blue'
  },
  {
    path: '/pages/CSS/border/border-radius',
    method: 'radioChangeBorderRadius',
    valueIndex: 2,
    styleName: 'border-radius',
    expectedValue: '5px'
  },
  {
    path: '/pages/CSS/border/border-right',
    method: 'radioChangeBorderRight',
    valueIndex: 3,
    styleName: 'border-right',
    expectedValue: '2px dashed blue'
  },
  {
    path: '/pages/CSS/border/border-style',
    method: 'radioChangeBorderStyle',
    valueIndex: 2,
    styleName: 'border-style',
    expectedValue: 'solid'
  },
  {
    path: '/pages/CSS/border/border-top',
    method: 'radioChangeBorderTop',
    valueIndex: 3,
    styleName: 'border-top',
    expectedValue: '2px dashed blue'
  },
  {
    path: '/pages/CSS/border/border-width',
    method: 'radioChangeBorderWidth',
    valueIndex: 3,
    styleName: 'border-width',
    expectedValue: '3px'
  },
  // box-shadow
  {
    path: '/pages/CSS/box-shadow/box-shadow',
    method: 'radioChangeBoxShadow',
    valueIndex: 3,
    styleName: 'box-shadow',
    expectedValue: '5px 5px 5px black'
  },
  // display
  {
    path: '/pages/CSS/display/flex',
    method: 'radioChangeDisplay',
    valueIndex: 1,
    styleName: 'display',
    expectedValue: 'flex'
  },
  {
    path: '/pages/CSS/display/none',
    method: 'radioChangeDisplay',
    valueIndex: 2,
    styleName: 'display',
    expectedValue: 'none'
  },
  // flex
  {
    path: '/pages/CSS/flex/flex-direction',
    method: 'radioChangeFlexDirection',
    valueIndex: 2,
    styleName: 'flex-direction',
    expectedValue: 'row-reverse'
  },
  {
    path: '/pages/CSS/flex/flex-flow',
    method: 'radioChangeFlexFlow',
    valueIndex: 2,
    styleName: 'flex-flow',
    expectedValue: 'row wrap'
  },
  {
    path: '/pages/CSS/flex/justify-content',
    method: 'radioChangeJustifyContent',
    valueIndex: 3,
    styleName: 'justify-content',
    expectedValue: 'center'
  },
  {
    path: '/pages/CSS/flex/align-content',
    method: 'radioChangeAlignContent',
    valueIndex: 3,
    styleName: 'align-content',
    expectedValue: 'center'
  },
  {
    path: '/pages/CSS/flex/align-items',
    method: 'radioChangeAlignItems',
    valueIndex: 3,
    styleName: 'align-items',
    expectedValue: 'center'
  },
  {
    path: '/pages/CSS/flex/flex',
    method: 'radioChangeFlex',
    valueIndex: 2,
    styleName: 'flex',
    expectedValue: '1'
  },
  {
    path: '/pages/CSS/flex/flex-basis',
    method: 'radioChangeFlexBasis',
    valueIndex: 3,
    styleName: 'flex-basis',
    expectedValue: '50px'
  },
  {
    path: '/pages/CSS/flex/flex-grow',
    method: 'radioChangeFlexGrow',
    valueIndex: 3,
    styleName: 'flex-grow',
    expectedValue: '1'
  },
  {
    path: '/pages/CSS/flex/flex-shrink',
    method: 'radioChangeFlexShrink',
    valueIndex: 2,
    styleName: 'flex-shrink',
    expectedValue: '1'
  },
  {
    path: '/pages/CSS/flex/align-self',
    method: 'radioChangeAlignSelf',
    valueIndex: 2,
    styleName: 'align-self',
    expectedValue: 'center'
  },
  {
    path: '/pages/CSS/flex/flex-wrap',
    method: 'radioChangeFlexWrap',
    valueIndex: 2,
    styleName: 'flex-wrap',
    expectedValue: 'wrap'
  },
  // margin
  {
    path: '/pages/CSS/margin/margin-auto',
    method: 'radioChangeMargin',
    valueIndex: 3,
    styleName: 'margin',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/margin/margin-bottom',
    method: 'radioChangeMarginBottom',
    valueIndex: 3,
    styleName: 'margin-bottom',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/margin/margin-left',
    method: 'radioChangeMarginLeft',
    valueIndex: 3,
    styleName: 'margin-left',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/margin/margin-right',
    method: 'radioChangeMarginRight',
    valueIndex: 3,
    styleName: 'margin-right',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/margin/margin-top',
    method: 'radioChangeMarginTop',
    valueIndex: 3,
    styleName: 'margin-top',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/margin/margin',
    method: 'radioChangeMargin',
    valueIndex: 3,
    styleName: 'margin',
    expectedValue: '20px'
  },
  // padding
  {
    path: '/pages/CSS/padding/padding-bottom',
    method: 'radioChangePaddingBottom',
    valueIndex: 3,
    styleName: 'padding-bottom',
    expectedValue: '40px'
  },
  {
    path: '/pages/CSS/padding/padding-left',
    method: 'radioChangePaddingLeft',
    valueIndex: 3,
    styleName: 'padding-left',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/padding/padding-right',
    method: 'radioChangePaddingRight',
    valueIndex: 3,
    styleName: 'padding-right',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/padding/padding-top',
    method: 'radioChangePaddingTop',
    valueIndex: 3,
    styleName: 'padding-top',
    expectedValue: '20px'
  },
  {
    path: '/pages/CSS/padding/padding',
    method: 'radioChangePadding',
    valueIndex: 3,
    styleName: 'padding',
    expectedValue: '10px'
  },
  // text
  {
    path: '/pages/CSS/text/text-align',
    method: 'radioChangeTextAlign',
    valueIndex: 2,
    styleName: 'text-align',
    expectedValue: 'center'
  },
  {
    path: '/pages/CSS/text/color',
    method: 'radioChangeColor',
    valueIndex: 2,
    styleName: 'color',
    expectedValue: '#f00'
  },
  {
    path: '/pages/CSS/text/font-weight',
    method: 'radioChangeFontWeight',
    valueIndex: 4,
    styleName: 'font-weight',
    expectedValue: '500'
  },
  {
    path: '/pages/CSS/text/text-decoration-line',
    method: 'radioChangeTextDecorationLine',
    valueIndex: 2,
    styleName: 'text-decoration-line',
    expectedValue: 'underline'
  },
  {
    path: '/pages/CSS/text/text-overflow',
    method: 'radioChangeTextOverflow',
    valueIndex: 2,
    styleName: 'text-overflow',
    expectedValue: 'ellipsis'
  },
  {
    path: '/pages/CSS/text/text-shadow',
    method: 'radioChangeTextShadow',
    valueIndex: 3,
    styleName: 'text-shadow',
    expectedValue: '5px 5px #558abb'
  },
  {
    path: '/pages/CSS/text/white-space',
    method: 'radioChangeWhiteSpace',
    valueIndex: 3,
    styleName: 'white-space',
    expectedValue: 'pre'
  },
  {
    path: '/pages/CSS/text/font-style',
    method: 'radioChangeFontStyle',
    valueIndex: 2,
    styleName: 'font-style',
    expectedValue: 'italic'
  },
  // transition
  {
    path: '/pages/CSS/transition/transition-delay',
    method: 'radioChangeTransitionDelay',
    valueIndex: 3,
    styleName: 'transition-delay',
    expectedValue: '1s'
  },
  {
    path: '/pages/CSS/transition/transition-timing-function',
    method: 'radioChangeTransitionTimingFunction',
    valueIndex: 3,
    styleName: 'transition-timing-function',
    expectedValue: 'ease-out'
  },
]

// 固定的测试选择器
const testSelectors = [
  '.test-view',
  '.test-text',
  '.test-image',
  '.test-view-flatten',
  '.test-text-flatten',
  '.test-image-flatten'
]

// 将测试配置分批
const BATCH_SIZE = 15;
const cssTestBatches = [];
for (let i = 0; i < cssTests.length; i += BATCH_SIZE) {
  cssTestBatches.push(cssTests.slice(i, i + BATCH_SIZE));
}

// 为每个批次创建独立的测试套件
cssTestBatches.forEach((batch, batchIndex) => {
  describe(`CSS setProperty Batch ${batchIndex + 1}`, () => {
    let localTestIndex = 0;

    beforeAll(async () => {
      console.log(`Starting CSS batch ${batchIndex + 1} with ${batch.length} tests`);
    });

    afterAll(async () => {
      console.log(`Finished CSS batch ${batchIndex + 1}`);
    });

    test.each(batch)("%s", async () => {
      const testCase = batch[localTestIndex];
      console.log(`Testing: ${testCase.path}`);

      // 1. 打开页面
      const page = await program.reLaunch(testCase.path);
      await page.waitFor(3000);

      // 2. 调用方法并截图
      await page.callMethod(testCase.method, testCase.valueIndex);
      await page.waitFor(100);

      const image = await program.screenshot({ fullPage: true });
      expect(image).toSaveImageSnapshot({
        customSnapshotIdentifier() {
          return `__set-css-test__/${testCase.path.replace(/\//g, "-").substring(1)}`
        }
      });

      // TOODO 断言getPropertyValue值
      // 3. 循环断言所有选择器
      // for (const selector of testSelectors) {
      //   const element = await page.$(selector);
      //   const styleValue = await element.style(testCase.styleName);
      //   expect(styleValue).toBe(testCase.expectedValue);
      // }

      await page.waitFor(500);
      localTestIndex++;
    });
  });
});
