# Oduck UI 优化 Git Workflow

## 分支策略

```
main (保护分支)
├── feature/bangs-icon-dynamic
├── feature/sources-rename-presets
├── feature/sources-item-design
├── feature/list-hover-effect
├── feature/extension-connection-status
└── feature/extension-install-notice
```

---

## PR 1: Sources → Presets 文案变更

**目标**: 将所有 "Sources" 文案统一改为 "Presets"

### 涉及文件
- `src/components/BangImportModal.vue` — 标题、按钮、提示文案
- `src/custom.vue` — 页面标题、导航、空状态、选择器
- `packages/ui/src/components/BangManagePanel.vue` — 标题、说明文案
- `index.html` — 页面 title

### 改动范围
- "Sources" → "Presets"
- "来源" → "预设" (中文)
- "Import from sources" → "Import from presets"

### 验收标准
- [ ] 所有界面中不再有 "Sources" 字样
- [ ] 中英文文案一致性检查通过
- [ ] 不影响任何功能逻辑

---

## PR 2: Import Bangs Icon 动态化

**目标**: BangImportModal 中的 bang 图标改为动态获取

### 涉及文件
- `src/components/BangImportModal.vue`
- `src/components/BangList.vue` (参考 icon 动态化实现)

### 当前状态
- `getBangIcon()` 返回固定 URL: `https://favicon.im/${host}?larger=true`

### 改动方案
```vue
<!-- 动态图标组件 -->
<img
  v-if="hasIcon(bang)"
  :src="getDynamicIcon(bang)"
  :alt="bang.t"
  class="bang-icon"
  @error="onIconError(bang)"
/>
<span v-else class="bang-icon-fallback">{{ bang.t[0] }}</span>
```

### 动态逻辑
1. 尝试 `https://favicon.im/${host}?larger=true`
2. 失败时回退到 `https://www.google.com/s2/favicons?domain=${host}&sz=32`
3. 再失败显示首字母 fallback

### 验收标准
- [ ] 所有 bang icon 动态加载
- [ ] 加载失败有优雅降级
- [ ] 网络异常不阻塞列表渲染

---

## PR 3: Sources/Presets Item 设计优化

**目标**: 优化 BangSourceCards 中卡片/列表项的视觉设计

### 涉及文件
- `src/components/BangSourceCards.vue`
- `src/style.css` (新增样式)

### 当前问题
- 卡片间距不够紧凑
- 缺少视觉层次
- hover 状态不明显

### 设计优化方向
1. **卡片布局**: 更紧凑的间距，清晰的分割线
2. **信息层次**: 图标→名称→描述→统计的层级
3. **交互状态**: 更明显的 hover/active 状态
4. **添加按钮**: 更醒目的 CTA 样式

### 验收标准
- [ ] 视觉层级清晰
- [ ] hover 状态反馈明确
- [ ] 移动端适配良好
- [ ] 暗色模式兼容

---

## PR 4: List Hover 效果优化

**目标**: 优化 BangList 中列表项的 hover 交互效果

### 涉及文件
- `src/components/BangList.vue`
- `src/style.css`

### 当前状态
- 简单的背景色变化
- 没有过渡动画

### 优化方案
```css
.bang-list-item {
  transition: all 0.2s ease;
}
.bang-list-item:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
}
.bang-list-item .actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.bang-list-item:hover .actions {
  opacity: 1;
}
```

### 验收标准
- [ ] hover 有平滑过渡动画
- [ ] 操作按钮 hover 时显示
- [ ] 不影响性能（无重排）

---

## PR 5: 扩展程序连接感知

**目标**: 主站能感知浏览器扩展是否安装并显示状态

### 涉及文件 (主站)
- `src/main.ts` — 扩展检测逻辑
- `src/components/oduck-header.vue` — 状态显示
- `src/search.vue` — 状态联动

### 涉及文件 (扩展)
- `packages/search-wxt/src/entrypoints/content-search.content/index.ts`
- `packages/search-wxt/src/entrypoints/background.ts`

### 通信方案
```typescript
// 主站检测扩展是否安装
const checkExtension = () => {
  return new Promise((resolve) => {
    window.postMessage({ type: 'ODUCK_PING' }, '*');
    const timeout = setTimeout(() => resolve(false), 500);
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'ODUCK_PONG') {
        clearTimeout(timeout);
        resolve(true);
      }
    }, { once: true });
  });
};
```

### 扩展端响应
```typescript
// content-search.content/index.ts
window.addEventListener('message', (e) => {
  if (e.data?.type === 'ODUCK_PING') {
    window.postMessage({ type: 'ODUCK_PONG', version: '1.0.0' }, '*');
  }
});
```

### 验收标准
- [ ] 扩展安装时显示 "已连接"
- [ ] 扩展未安装时显示 "未连接"
- [ ] 检测超时机制健壮
- [ ] 不影响页面加载性能

---

## PR 6: 主页扩展程序安装提示

**目标**: 在主页添加扩展程序安装提示

### 涉及文件
- `src/search.vue` — 提示组件
- `src/components/ExtensionInstallNotice.vue` (新建)
- `src/style.css` — 提示样式

### 依赖
- 依赖 PR 5 的扩展检测逻辑

### 设计
- 首次访问时显示横幅提示
- 提供 "去安装" 按钮 (跳转 Chrome Web Store)
- 已安装时隐藏
- 可手动关闭 (记录到 localStorage)

### 验收标准
- [ ] 未安装扩展时显示提示
- [ ] 已安装时不显示
- [ ] 用户可关闭提示
- [ ] 关闭状态持久化

---

## 合并顺序

```
1. PR-1: feature/sources-rename-presets
        ↓
2. PR-4: feature/list-hover-effect      (无依赖)
        ↓
3. PR-2: feature/bangs-icon-dynamic     (可并行)
        ↓
4. PR-3: feature/sources-item-design    (依赖 PR-1)
        ↓
5. PR-5: feature/extension-connection-status
        ↓
6. PR-6: feature/extension-install-notice (依赖 PR-5)
```

## 合并检查清单

- [ ] 所有 PR 通过代码审查
- [ ] 所有 PR 通过 CI 检查 (lint + build)
- [ ] 手动测试通过
- [ ] 无合并冲突
- [ ] 更新 CHANGELOG.md
