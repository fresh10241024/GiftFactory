# Gift Manifest v1

Gift Manifest 是 rx 后端交给 hy 前端 renderer 的最终结构化交付物。AI 不直接生成 HTML，而是生成一份 JSON 配置；前端根据 `theme`、`blocks` 和每个 block 的 `data` 渲染最终礼物网站。

## 目标

- 让 AI 只能从已批准的场景块中选择，不自由幻想页面结构。
- 让 hy 可以独立开发 renderer，用 mock manifest 先跑通。
- 让 rx 可以独立实现 AI 编排和后端保存，只要输出符合本文档。
- 让用户后续编辑内容时，可以精确保存到 manifest 的某个 block / 某个字段。

## 顶层结构

```json
{
  "version": "1.0",
  "meta": {
    "language": "zh",
    "theme": "dark-memory",
    "title": "A gift for someone special",
    "recipientName": "小林",
    "senderName": "晓明",
    "occasion": "birthday",
    "createdBy": "ai"
  },
  "blocks": [
    {
      "id": "photo-stage-1",
      "block": "photo-exploration-ui",
      "data": {}
    }
  ]
}
```

## 字段约束

| 字段 | 必填 | 说明 |
|---|---:|---|
| `version` | 是 | 当前固定为 `"1.0"` |
| `meta` | 是 | 全局信息，不直接决定某个 block 的内容 |
| `meta.language` | 是 | `"zh"` 或 `"en"`，用于前端选择语言和字体策略 |
| `meta.theme` | 是 | 主题 id。v1 可先用 `"dark-memory"` 占位 |
| `meta.title` | 否 | 礼物整体标题，主要用于浏览器标题、dashboard、分享卡片 |
| `meta.recipientName` | 否 | 收礼人名称 |
| `meta.senderName` | 否 | 送礼人名称 |
| `meta.occasion` | 否 | 生日、纪念日、毕业等 |
| `meta.createdBy` | 否 | `"ai"` / `"user"` / `"mixed"` |
| `blocks` | 是 | 有序数组。数组顺序就是网页从上到下的渲染顺序 |
| `blocks[].id` | 是 | 当前 manifest 内唯一的 block 实例 id，用于编辑保存 |
| `blocks[].block` | 是 | 场景块 id，必须存在于 `fronted.hy/blocks/registry.json` 且状态为 `approved` |
| `blocks[].data` | 是 | 必须符合对应 block 的 `block.json` slots 约束 |

## Approved Blocks

v1 第一批 approved block：

```json
[
  {
    "id": "photo-exploration-ui",
    "schemaPath": "fronted.hy/blocks/photo-exploration-ui/block.json"
  }
]
```

rx 生成 manifest 时只能选择 `fronted.hy/blocks/registry.json` 中 `status: "approved"` 的 block。

## photo-exploration-ui 示例

```json
{
  "version": "1.0",
  "meta": {
    "language": "zh",
    "theme": "dark-memory",
    "title": "A small gallery of us",
    "recipientName": "小林",
    "createdBy": "ai"
  },
  "blocks": [
    {
      "id": "photo-stage-1",
      "block": "photo-exploration-ui",
      "data": {
        "photos": [
          {
            "src": "https://cdn.example.com/gifts/abc/photo-01.jpg",
            "alt": "A quiet afternoon",
            "title": "Blue Hour Promise",
            "eyebrow": "MEMORY 01",
            "summary": "A frame for the promise to meet again when the sky turns blue.",
            "detail": "那天其实没有发生什么惊天动地的事情，但正因为这样，它才像一张真正属于我们的照片。",
            "primaryColor": "#86dec7"
          }
        ]
      }
    }
  ]
}
```

## 生成职责

rx 后端负责：

- 从对话和上传照片中整理原始素材。
- 生成或保存图片 URL。
- 为照片生成 `title`、`summary`、`detail`。
- 提取或推断每张照片的 `primaryColor`。
- 只选择 approved block。
- 校验 AI 输出是否符合 manifest v1 和 block schema。
- 保存 manifest 到数据库。

hy 前端负责：

- 维护 approved block 的实现和约束文档。
- 实现 renderer：读取 manifest，根据 `blocks[].block` 找到对应组件，并把 `blocks[].data` 传入。
- 用 mock manifest 独立测试，不等待 rx 接入。
- 用户编辑后，把修改位置和新 manifest / patch 交回后端保存。

## 保存建议

MVP 推荐在 `gifts` 表新增：

```sql
ALTER TABLE gifts ADD COLUMN config JSONB DEFAULT '{}';
```

生成完成后：

- `gifts.config` 保存完整 Gift Manifest。
- `/gifts/:slug/config` 返回 manifest 给前端。
- 用户编辑详情文字时，更新对应路径：

```txt
blocks[id=photo-stage-1].data.photos[photoIndex].detail
```

短期可以 PATCH 整份 config；长期可以做 JSON patch。

## hy / rx 并行方式

hy 不需要等 rx 完成 AI manifest 生成。推荐并行：

1. hy 先用 mock manifest 做 renderer。
2. rx 按本文档生成真实 manifest。
3. 两边用同一个 mock/真实 JSON 做联调。

判断 renderer 是否合格的标准是：把 mock manifest 换成 rx 返回的 manifest，前端不需要改组件代码。

## 校验规则

rx 保存前至少校验：

- `version === "1.0"`
- `blocks` 是非空数组
- 每个 `blocks[].id` 在 manifest 内唯一
- 每个 `blocks[].block` 都在 `fronted.hy/blocks/registry.json` 中，且 `status === "approved"`
- 每个 `blocks[].data` 满足对应 `block.json` 的必填字段
- 图片 URL 可访问，生产环境图片需要支持 CORS
- AI 不得输出未注册 block id

## 非目标

v1 暂不解决：

- 多人协同编辑
- 版本历史
- block marketplace
- 复杂主题系统
- 单张照片独立数据库表

这些可以等 v1 跑通后再拆。
