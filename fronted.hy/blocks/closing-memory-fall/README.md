# 记忆落幕祝福 · closing-memory-fall

`closing-memory-fall` 是 Gift Factory 的结尾场景块。它用一句收束祝福、署名，以及鼠标/触摸触发的照片落下互动，为礼物网站留下轻盈的余韵。

## 数据入口

```tsx
type ClosingMemoryFallData = {
  headline: string;
  message?: string;
  signature?: string;
  images?: string[];
  accentColor?: string;
};
```

## Manifest 示例

```json
{
  "id": "closing-1",
  "block": "closing-memory-fall",
  "data": {
    "headline": "Keep this close",
    "message": "Some memories do not end. They keep finding their way back into view.",
    "signature": "From 晓明",
    "images": ["./1.webp", "./2.webp", "./3.webp"],
    "accentColor": "#f2b48d"
  }
}
```

完整约束见同目录 `block.json`。
