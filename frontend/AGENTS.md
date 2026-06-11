# Frontend AGENTS

本文件定义 `frontend/` 目录下的局部规则。进入该目录或修改其子文件时，本文件优先于根目录中更宽泛的前端描述。

## 适用范围

- `frontend/src/`
- `frontend/index.html`
- `frontend/vite.config.ts`
- `frontend/tailwind.config.ts`

## 前端约定

- 当前前端为 Vue 3 + TypeScript + Vite + Tailwind CSS。
- 优先使用组合式 API 和明确类型，不把请求、视图和复杂数据转换混在一起。
- 接口访问统一走 `frontend/src/services/`，不要在多个组件里散落重复请求配置。
- 页面状态至少考虑 `loading`、`error`、`empty` 和正常数据态中与本次需求相关的部分。
- 小型页面保持直接清晰；只有在重复明显或逻辑复杂时再拆组件或组合函数。

## 样式约定

- 先复用已有 Tailwind 风格和间距节奏，再新增样式。
- 不为了局部改动引入新的视觉体系或大面积重写页面结构。
- 文本不能出现明显溢出、遮挡或窄屏布局崩坏。

## 前端验证

修改后优先执行：

```sh
cd frontend
npm run lint
npm run build
```

涉及页面或交互时，还应说明：

- 改动影响的页面或组件
- 接口依赖是否变化
- 是否做过手动联调或视觉检查

