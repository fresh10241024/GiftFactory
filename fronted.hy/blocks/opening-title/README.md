# 动态开场标题 · opening-title

`opening-title` 是 Gift Factory 的开场场景块。它不做长信件，而是用高质量动态标题、黑色舞台和一张代表照片建立第一印象。

## 数据入口

```tsx
type OpeningTitleData = {
  headline: string;
  subheadline?: string;
  kicker?: string;
  image?: string;
  imageAlt?: string;
  accentColor?: string;
};
```

## Manifest 示例

```json
{
  "id": "opening-1",
  "block": "opening-title",
  "data": {
    "headline": "For the one who stayed",
    "subheadline": "A small website made from our memories.",
    "kicker": "Gift Factory presents",
    "image": "./1.webp",
    "imageAlt": "Opening memory",
    "accentColor": "#b7ff4a"
  }
}
```

完整约束见同目录 `block.json`。
