<template>
  <div class="search-panel">
    <el-form :inline="true">
      <div class="search-item-container" v-for="(layout, index) in layoutList" :key="index" :span="6">
        <el-form-item style="margin: 0;">
          <!--     标题框      -->
          <template #label>
            <el-select :value="searchList[index].prop" :size="size" :style="getLabelWidth(searchList[index].prop)"
              placeholder="请选择" clearable @change="handleQueryChange(index, $event)">
              <el-option v-for="item in queryOptions" :key="item.prop" :label="item.label" :value="item.prop" />
            </el-select>
          </template>

          <!-- 时间选择器 -->
          <el-date-picker v-if="layout.type === 'datetime'" v-model="searchList[index].value"
            :style="getValueWidth(searchList[index].prop)" :size="size" type="datetime" value-format="yyyy-MM-dd HH:mm:ss"
            format="yyyy-MM-dd HH:mm:ss" :placeholder="layout.placeholder || '请选择'" />

          <!-- 树形结构 -->
          <select-tree v-else-if="layout.type === 'tree'" v-model="searchList[index].value" :props="layout.props"
            :options="layout.options" :filterable="layout.filterable" :multiple="layout.multiple" :size="size"
            :leafOnly="layout.leafonly" :placeholder="layout.placeholder || '请选择'"
            :style="getValueWidth(searchList[index].prop)" />

          <!-- 下拉选框 -->
          <el-select v-else-if="layout.type === 'select' && checkSelectOptions(layout)" :key="getKey(layout.prop)"
            :multiple="layout.multiple" v-model="searchList[index].value" :size="size"
            :style="getValueWidth(searchList[index].prop)" :placeholder="layout.placeholder || '请选择'" clearable>
            <el-option v-for="item in layout.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>

          <!-- 插槽 -->
          <div v-else-if="layout.type === 'slot'">
            <slot :name="layout.slotName" :searchList="searchList" :setQuerys="setQuerys" />
          </div>

          <!-- 输入框 -->
          <el-input v-else v-model="searchList[index].value" :placeholder="layout.placeholder || '请输入'"
            :style="getValueWidth(searchList[index].prop)" :size="size" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
      </div>
      <el-form-item>
        <col-button class="act-button" type="warning" icon="plus" :size="size" @click.prevent="addQuery" />
        <col-button class="act-button" type="danger" icon="delete" :size="size" @click.prevent="substractQuery" />
        <col-button class="act-button" title="搜索" type="primary" :size="size" icon="search"
          @click.prevent="handleQuery" />
        <col-button class="act-button" title="重置" icon="refresh" :size="size" @click.prevent="handleReset" />
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
import colButton from '../buttons/index.vue'
import SelectTree from '../select-tree/index.vue'
import _ from 'lodash'

export default {
  name: 'search-panel',
  components: { colButton, SelectTree },
  props: {
    store: {
      type: Object
    },
    // 最大可选数限制
    limit: {
      type: Number,
      default: 3
    },
    paramList: {
      type: Array,
      default: () => []
    },
    defaultQuerys: {
      type: Array,
      default: () => []
    },
    size: {
      type: String,
      default: 'mini'
    }
  },
  data() {
    return {
      queryOptions: [], // 可选的查询条件
      searchList: [{}], // 查询条件 [{ prop: '', value: '' } ...]
      freshKey: new Date().getTime()
    }
  },
  computed: {
    layoutList() {
      const list = this.searchList.map(item => {
        return this.paramList.find(option => option.prop === item.prop) || {}
      }).filter(item => item)
      return _.cloneDeep(list)
    },
  },
  mounted() {
    this.initQuery()
  },
  methods: {
    initQuery() {
      this.queryOptions = _.cloneDeep(this.paramList)

      // 赋予查询项默认空值
      this.searchList = this.defaultQuerys.map(prop => ({
        prop: prop,
        value: undefined
      }))
    },
    getKey(val) {
      return val + '_' + this.freshKey
    },
    handleQuery() {
      const querys = this.getQuerys()
      this.$emit('query', querys)
    },
    handleReset() {
      this.initQuery()
      this.handleQuery()
    },
    addQuery() {
      this.searchList.push({})
    },
    substractQuery() {
      this.searchList.pop()
    },
    // 获取查询条件
    getQuerys() {
      const querys = {}
      // 过滤空值
      this.searchList.map(item => {
        if (item.prop && ![undefined, null, ''].includes(item.value)) {
          querys[item.prop] = item.value
        }
      })
      return querys
    },
    // 设置查询条件
    setQuerys(prop, value) {
      const find = this.searchList.find(item => item.prop === prop)
      if (find) {
        find.value = value
      }
    },
    getLabelWidth(prop) {
      const find = this.paramList.find(item => item.prop === prop)

      if (find && find.labelWidth) {
        return { width: find.labelWidth + 'px' }
      }
      return { width: '100px' }
    },
    getValueWidth(prop) {
      const find = this.paramList.find(item => item.prop === prop)

      if (find && find.valueWidth) {
        return { width: find.valueWidth + 'px' }
      }
      return { width: '120px' }
    },
    // 判断options是否存在，并发起请求
    async checkSelectOptions(layout) {
      if (!layout.options && layout.optionSource) {
        // 将请求得到的值放到 store 中缓存
        const res = await this.store.setOptionsCache(layout.optionSource)

        if (!res) {
          return layout.options || layout.optionSource
        }
        layout.options = res.data
        this.freshKey = new Date().getTime()
      }
      return layout.options || layout.optionSource
    },
    // 查询项改变
    handleQueryChange(index, val) {
      const find = this.searchList.find(item => item.prop === val)
      if (find) {
        this.$message.warning(`该查询项已存在`)
      } else {
        this.searchList[index].prop = val
        this.searchList[index].value = undefined
      }
    }
  },
  watch: {
    searchList() {
      this.$emit('query-change', this.searchList)
    }
  }
}
</script>
  
<style lang="scss" scoped>
.search-item-container {
  margin-right: 15px;
  display: inline-block;
  vertical-align: top;

  .el-form-item {
    margin-bottom: 0;
  }
}

.act-button {
  transform: scale(0.95);
  margin-left: 2px!important;
}

.el-form-item {
  margin: 0;
}

::v-deep(.el-form-item__label) {
  padding-right: 1px;
}

::v-deep(.vue-treeselect__control) {
  transform: scaleY(0.77);
}
</style>
  