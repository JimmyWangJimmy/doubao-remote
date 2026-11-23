---
name: Bug report
about: 某个工具在你这版豆包上失效
labels: bug
---

**环境**
- macOS：<!-- sw_vers -productVersion -->
- Doubao.app：<!-- defaults read /Applications/Doubao.app/Contents/Info.plist CFBundleShortVersionString -->
- Chrome 内核：<!-- curl -s 127.0.0.1:9333/json/version -->
- Node：<!-- node -v -->

**复现步骤**
1.
2.

**期望 / 实际**

**证据**
```
粘贴 `node scripts/smoke.js` 里失败那条的输出
```

**自检**
- [ ] `doubao_desktop_status` 里 `devtools.error` 为空
- [ ] 已试过 `doubao_desktop_snapshot` 看当前页面
