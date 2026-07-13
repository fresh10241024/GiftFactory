# 照片探索与展示界面 · photo-exploration-ui

播放器式 3D 照片封面舞台。用户通过拖拽、滑动或左右按钮浏览照片；中心照片突出显示，左右照片后退旋转；点击中心照片进入可编辑详情卡片。

## 文件

| 文件 | 说明 |
|---|---|
| `block.json` | 场景块约束文档：数据结构、交互、视觉规则、降级策略 |
| `PhotoExplorationUI.tsx` | React 组件实现 |

## 技术依赖

- React / Next.js compatible
- Tailwind CSS
- Framer Motion
- html2canvas（复制详情卡片为图片）

## 数据入口

组件接收 `photos` 数组：

```tsx
type PhotoExplorationItem = {
  src: string;
  alt?: string;
  title: string;
  eyebrow?: string;
  summary: string;
  detail: string;
  primaryColor: string;
};
```

示例：

```tsx
<PhotoExplorationUI
  photos={[
    {
      src: "/photos/01.jpg",
      title: "Blue Hour Promise",
      eyebrow: "MEMORY 01",
      summary: "A frame for the promise to meet again when the sky turns blue.",
      detail: "这段文字由 AI 生成初稿，用户可以在详情卡片中继续编辑。",
      primaryColor: "#86dec7",
    },
  ]}
/>
```

## 编辑保存建议

详情文字编辑时，组件会先更新前端状态。正式接入产品时，建议通过 `onTextChange(index, detail)` 做防抖保存，把编辑后的 `photos[index].detail` 写回后端的 gift config。

MVP 阶段可以直接保存整份 `gifts.config` JSON；后续如果需要版本历史、多人编辑或单张照片独立管理，再拆成独立表。

## 查看完整约束

完整约束见同目录：

```txt
fronted.hy/blocks/photo-exploration-ui/block.json
```
