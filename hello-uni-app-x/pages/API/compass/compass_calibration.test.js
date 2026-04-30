// uni-app自动化测试教程: uni-app自动化测试教程: https://uniapp.dcloud.net.cn/worktile/auto/hbuilderx-extension/

const phone_compass_data = process.env.APP_COMPASS_DATA;
const PAGE_PATH = '/pages/API/compass/compass';
const DEGREE_TOLERANCE = 3;

function parseCompassData(text) {
    if (typeof text != 'string') {
        throw new Error(`Invalid compass data: ${text}`);
    }
    const match = text.match(/^(.+?)(\d+(?:\.\d+)?)°$/);
    if (match == null) {
        throw new Error(`Invalid compass data: ${text}`);
    }
    return {
        direction: match[1],
        degree: Number(match[2])
    };
}

function resolveDirectionText(value) {
    if (value >= 337.5 || value < 22.5) {
        return '北';
    }
    if (value < 67.5) {
        return '东北';
    }
    if (value < 112.5) {
        return '东';
    }
    if (value < 157.5) {
        return '东南';
    }
    if (value < 202.5) {
        return '南';
    }
    if (value < 247.5) {
        return '西南';
    }
    if (value < 292.5) {
        return '西';
    }
    return '西北';
}

describe('指南针校验', () => {

    let page
    beforeAll(async () => {
        page = await program.reLaunch(PAGE_PATH);
        await page.waitFor('view');
    });

    it('对比手机系统指南针应用数据（误差小于3）', async () => {
        await page.callMethod('startCompassListen')
        await page.waitFor(2000)

        const dv = await page.$('.direction-value')
        const direction_value = await dv.text();
        const dd = await page.$('.direction-degree')
        const direction_degree = await dd.text();
        const direction_text = direction_value + direction_degree;
        const actual = parseCompassData(direction_text);
        const expected = parseCompassData(phone_compass_data);

        expect(actual.direction).toBe(resolveDirectionText(actual.degree));
        expect(expected.direction).toBe(resolveDirectionText(expected.degree));
        expect(Math.abs(actual.degree - expected.degree)).toBeLessThanOrEqual(DEGREE_TOLERANCE);
    });
});
