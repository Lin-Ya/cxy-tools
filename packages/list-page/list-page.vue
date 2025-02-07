<template>
    <div class="list-page">
        <!-- 搜索部分 -->
        <search-panel ref="searchRef" :store="store" :param-list="search.queryOptions" :size="pageData.size"
            :default-querys="search.defaultQuerys" @query="handleQuery" @query-change="handleQueryChange">
            <template #[key]="{ searchList, setQuerys }" v-for="(value, key) in $scopedSlots">
                <slot :name="key" :searchList="searchList" :setQuerys="setQuerys" />
            </template>
        </search-panel>
        <el-divider class="divider" />
        <!-- 按钮部分 -->
        <el-row class="buttons">
            <template v-for="(button, index) in buttonList">
                <button-item :store="store" :key="index" :button="button" :refresh="refresh" :current-row="currentRow"
                    :size="pageData.size" :multiple-selection="multipleSelection" />
            </template>
            <!-- 自定义按钮 -->
            <slot name="buttons" v-bind:currentRow="currentRow" v-bind:multipleSelection="multipleSelection"
                :isSelected="isSelected" :isSingleSelected="isSingleSelected" :isMultiSelected="isMultiSelected"></slot>

            <!-- 列编辑 -->
            <div class="column-edit">
                <column-edit :columns="table.columns" @save="onColumnChange" />
            </div>
        </el-row>
        <!-- 排序tag部分 -->
        <el-row v-if="seqence.length" style="margin: 10px 0">
            <el-tag v-for="(item, index) in seqence" :key="index" size="mini" closable style="margin-right: 6px;"
                type="info" @close="handleSeqenceTagClose(index)">
                {{ item | filterSequence(seqenceOptions) }}
            </el-tag>
        </el-row>
        <!-- 表格部分 -->
        <el-table ref="table" v-loading="tableLoading" :data="table.tableData" element-loading-text="拼命加载中"
            element-loading-spinner="el-icon-loading" row-key="id" :height="tableHeight" border
            @current-change="handleCurrentRowChange" @selection-change="handleSelectionChange"
            @sort-change="handleSortChange">
            <el-table-column v-if="withDefault(table.showSelection, true)" align="center" type="selection" width="50" />
            <el-table-column v-if="withDefault(table.showIndex, true)" align="center" label="序号" type="index" width="100" />
            <!-- 子表 -->
            <el-table-column v-if="table.childrenTable" label="展开" width="50" type="expand">
                <template slot-scope="props">
                    <el-table :data="props.row[table.childrenTable.prop]" border>
                        <template v-for="(item, index) in table.childrenTable.columns">
                            <table-columns :key="index" :item="item">
                                <template #[key]="{ row, index }" v-for="(value, key) in $scopedSlots">
                                    <slot :name="key" :row="row" :index="index" />
                                </template>
                            </table-columns>
                        </template>
                    </el-table>
                </template>
            </el-table-column>

            <template v-for="(item, index) in table.columns">
                <table-columns :key="index" :item="item">
                    <template #[key]="{ row, index }" v-for="(value, key) in $scopedSlots">
                        <slot :name="key" :row="row" :index="index" />
                    </template>
                </table-columns>
                <!-- 如果隐藏  保留这块原始的table column 渲染逻辑
                <div v-if="item.hide" :key="index"></div>
                插槽
                <el-table-column v-else-if="item.slotName" :key="index" :align="item.align" :label="item.title"
                    :min-width="item.width" :prop="item.prop" :show-overflow-tooltip="item.show_overflow_tooltip || true"
                    :sortable="item.sortable" header-align="center">
                    <template slot-scope="scope">
                        <slot :name="item.slotName" :row="scope.row" :index="scope.$index" />
                    </template>
                </el-table-column>
                字典
                <el-table-column v-else-if="item.options" :key="index" :align="item.align" :label="item.title"
                    :min-width="item.width" :prop="item.prop" :show-overflow-tooltip="item.show_overflow_tooltip || true"
                    :sortable="item.sortable" header-align="center">
                    <template slot-scope="scope">
                        <span>{{ scope.row[item.prop] | valueToLabel(item.options) }}</span>
                    </template>
                </el-table-column>
                默认
                <el-table-column :key="index" v-else :align="item.align" :label="item.title" :min-width="item.width"
                    :prop="item.prop" :show-overflow-tooltip="item.show_overflow_tooltip || true" :sortable="item.sortable"
                    header-align="center" /> -->
            </template>
        </el-table>
        <!-- 分页部分 -->
        <div>
            <el-pagination style="margin-top: 10px" :current-page="pages.pageNum" :page-sizes="pages.pageSizeOpts"
                :page-size="pages.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="pages.total"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
    </div>
</template>

<script>
import searchPanel from '../search-panel/index.vue'
import columnEdit from './components/columnEdit.vue'
import buttonItem from './components/buttonItem.vue'
import tableColumns from './components/tableColumns.vue'

import selectMixins from './mixins/selectRowMixin'
import tableHeightMixin from './mixins/tableHeightMixin'
import seqenceMixin from './mixins/seqenceMixin'
import pageMixin from './mixins/pageMixin'
import { createStore, mapStates } from './store/helper'

export default {
    name: 'list-page',
    mixins: [selectMixins, tableHeightMixin, seqenceMixin, pageMixin],
    components: {
        searchPanel, columnEdit, buttonItem, tableColumns
    },
    props: {
        pageData: {
            type: Object,
            default: () => ({})
        },
        requestFunc: {
            type: Function,
            default: null
        }
    },
    data() {
        this.store = createStore(this, {
            requestFunc: this.requestFunc
        })

        return {
            tableLoading: false,
            buttonList: this.pageData.buttons, // 按钮
        }
    },
    computed: {
        ...mapStates({
            search: 'search',
            pages: 'pages',
            sorts: 'sorts',
            table: 'table'
        })
    },
    created() {
        this.initScheme()
    },
    mounted() {
        this.initData()
        this.initTableHeight()
    },
    methods: {
        // 初始化结构
        initScheme() {
            this.store.commit('initScheme', {
                search: this.pageData.search,
                pages: this.pageData.pages,
                table: this.pageData.table,
            })
            // console.log('initScheme', this.store)
        },
        initData() {
            // 如果有tabledata，直接赋值
            if (this.pageData.table.tableData) {
                this.store.updateTableData(this.pageData.table.tableData)
            } else {
                this.getList()
            }
        },
        async getList() {
            if (!this.pageData.table.requestUrl && !this.pageData.table.requestFunc) {
                console.warn('请配置请求方式')
                return
            }

            const params = {
                search: this.search,
                pages: this.pages,
                sorts: this.sorts
            }

            if (this.pageData.table.requestFunc && typeof this.pageData.table.requestFunc === 'function') {
                await this.pageData.table.requestFunc.call(this, this.updateTableData, params)
                return
            }

            // console.group('getList 参数')
            // console.log('search', this.search)
            // console.log('pages', this.pages)
            // console.log('sorts', this.sorts)
            // console.groupEnd()

            const getParams = {
                ...this.search.queryParams, ...{
                    pageNo: this.pages.pageNum,
                    pageSize: this.pages.pageSize,
                    orders: this.sorts.map(item => `${item.prop} ${item.order === 'ascending' ? 'asc' : 'desc'}`)
                }
            }
            console.log('request params: ', getParams)

            this.tableLoading = true
            // 将请求方法从外部传入更好
            const res = await this.store.request(this.pageData.table.requestUrl, {
                params: getParams
            }).catch(err => console.error(err))
            this.tableLoading = false

            if (!res || res.code !== 200) {
                const msg = res && res.message ? res.message : '请求失败'
                this.$message.error(msg)
                return
            }

            this.$refs.table.setCurrentRow() // 清空选中项
            this.store.updatePageTotal(res.data.recordsTotal)
            this.store.updateTableData(res.data.data || [])
        },
        // 执行搜索
        runSearch() {
            this.$refs.searchRef.handleQuery()
        },
        refresh() {
            this.getList()
        },
        updateTableData(data) {
            this.store.updateTableData(data)
        },
        // 编辑列
        onColumnChange(columnList) {
            this.store.updateTableColumns(columnList)
        },
        handleQuery(queryParams) {
            this.resetPageNumber()
            this.$emit('query', queryParams)
            this.store.updateQueryParams(queryParams)
            this.refresh()
        },
        handleQueryChange() {
            this.initTableHeight()
        },
        withDefault(val, defaultVal) {
            return val === undefined ? defaultVal : val
        },
        getListData() {
            return this.store.getAllData()
        }
    },
}
</script>

<style scoped lang="scss">
.list-page {
    height: 100%;
    width: 100%;
    text-align: left;
    padding: 10px;
    box-sizing: border-box;

    .divider {
        margin: 5px 0;
        // width: auto;
    }

    .buttons {
        margin-bottom: 10px;
        padding-right: 60px;
        line-height: 34px;

        ::v-deep(.el-button) {
            margin-right: 10px;
            margin-left: 0;
        }
    }

    .column-edit {
        position: absolute;
        right: 5px;
        top: 0;
        z-index: 100;
    }
}

::v-deep(.el-table__expanded-cell) {
    padding: 10px;
    background: #dfdfdf;
}
</style>