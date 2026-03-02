<template>
    <view class="uni-table">
        <uni-table border stripe>
            <uni-tr>
                <uni-th align="center">错误信息</uni-th>
                <uni-th width="100" align="center">路由</uni-th>
                <uni-th width="100" align="center">时间</uni-th>
                <uni-th width="100" align="center">搜索</uni-th>
            </uni-tr>
            <uni-tr v-for="(log,index) in logs" :key="index">
                <uni-td>
                    <text class="err-msg">Error in {{log.info}}: `{{log.err}}`</text>
                </uni-td>
                <uni-td>
                    <navigator class="err-route" :url="log.route">{{log.route}}</navigator>
                </uni-td>
                <uni-td>
                    <text>{{log.time}}</text>
                </uni-td>
                <uni-td>
                    <!-- #ifdef H5 -->
                    <a v-for="engine in engines" :href="engine.url.replace('ERR_MSG',encodeURIComponent(log.err))"
                        target="_blank" class="err-search">{{engine.name}}</a>
                    <!-- #endif -->
                </uni-td>
            </uni-tr>
        </uni-table>
    </view>
</template>

<script>
    import {
        mapState
    } from 'vuex'
    import config from '@/admin.config.js'
    const debugOptions = config.navBar.debug || {}
    export default {
        data() {
            return {
                engines: debugOptions.engine || []
            };
        },
        computed: {
            ...mapState('error', ['logs'])
        },
        methods: {
            search(engine, log) {

            }
        }
    }
</script>

<style>
    .err-msg {
        color: #FF0000;
    }

    .err-search {
        margin-right: 10px;
    }
</style>
