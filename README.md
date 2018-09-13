# FateGrend0rder
FGO抽卡模拟器，页游。闲暇之时做的，为了满足自己集齐全SSR的愿望，和满破所有低星级卡的愿望。
<br/>
代码部署在一个测试服务器上，有兴趣的月厨可以来抽卡，但是服务器很卡，图片加载效果不是很好。
<br/>
传送门:http://storygame.top/game/service/fgo.html
<br/>
游戏内截图
<br/>
![召唤](https://github.com/623059008/FateGrend0rder/raw/master/doc_images/zh.jpg)
![打工](https://github.com/623059008/FateGrend0rder/raw/master/doc_images/dg.jpg)
![图鉴](https://github.com/623059008/FateGrend0rder/raw/master/doc_images/tj.jpg)
![强化](https://github.com/623059008/FateGrend0rder/raw/master/doc_images/qh.jpg)
![公告](https://github.com/623059008/FateGrend0rder/raw/master/doc_images/gg.jpg)
![交易](https://github.com/623059008/FateGrend0rder/raw/master/doc_images/jy.jpg)

# 代码大致结构
>Service
>>add_data_by_php.html 这里面写的东西是用来更新tj数据库的，就是卡牌数据，有了新的卡牌图之后，写好json数据，运行这个可以更新数据库tj表，然后就可以在卡池里抽到这张卡了
————————————————
>>fgo.html 游戏的显示主页
————————————————
>>index.html 游戏的本体，fgo.html里的iframe来源
————————————————
>>source

>>>php  所有后台功能都在这里

>>>>include 链接数据库的配置文件
>————————————————
>>>>dg.php 打工的功能处理
>————————————————
>>>>gg.php 公告的功能处理
>————————————————
>>>>jy.php 交易的功能处理
>————————————————
>>>>login.php 登录的功能处理
>————————————————
>>>>message.php 消息中心的功能处理
>————————————————
>>>>myitem.php 物品的功能处理，抽卡后的数据添加也在这里面
>————————————————
>>>>qh.php 强化的功能处理
>————————————————
>>>>tj.php 图鉴的功能处理
>————————————————
>>>>zh.php 召唤10连后的统计显示
>————————————————

>>>script 所有js脚本都在这里
>>>>fgo.js **最重要的文件!!所有功能的实现都在这个js里**

>>style 这里面就是字体，css，图片，音乐啦一堆东西
>>>index.css 这个就是index.html的样式，也是游戏的整体样式


# 关于作者
如果你想贡献卡面的图片，可以发到邮箱623059008@qq.com
注明贡献卡面
这个抽卡模拟器会保持持续更新，如果我有时间的话

# License
MIT
