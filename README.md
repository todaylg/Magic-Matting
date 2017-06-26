Magic-Matting
==================


Magic-Matting旨在解决只想简单的抠个图而不想开Ps这么个严重的问题，功能模仿Ps勾选连续像素取样后的魔棒工具，基于Flood-fill算法进行选区的生成。

### 主要功能

1. 导入图片（拖拽或选择）
2. 鼠标中键滚轮对图像进行放大或缩小
3. 鼠标左键点击生成选取，若按住左键向上滑动为小幅度增加容差值并动态扩大选区，若按住左键向下滑动则为大幅度增加容差值并动态扩大选区
4. 键盘“w”键增大容差值，“s”键减小容差值
5. ctrl/command + Z 撤销前一步选区的选取
6. ctrl/command + D 重置（填充像素与选取信息全部清空）
7. ctrl/command + delete/backspace 对当前选取进行扣除（显示时是以白色像素进行填充，下载后的图片是以透明像素进行填充）
8. 图片导出（PNG）及下载

### 实际测试
![image](https://github.com/todaylg/Magic-Matting/blob/master/introduceImg/before.jpg)

![image](https://github.com/todaylg/Magic-Matting/blob/master/introduceImg/after.png)


效果还并不理想，更适合对偏纯色背景的图案进行抠图（亚可真可爱~）

### Todo
- [ ] 限制选取范围
- [ ] 图片裁剪
- [ ] 动态扩展选取的撤销
- [ ] 多步撤销
- [ ] 选取缩减
- [ ] Chrome插件化

