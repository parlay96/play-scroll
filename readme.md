# play-scroll

> 一个上下拉，左右滑动插件

# method of use

> npm i playscroll

# playscroll 使用方法
    this.plScroll = new plScroll(this.$refs.plScroll, {
       yScroll: false, // Pull up and down£¨Pull up and down, slide left and right can't be true at the same time£©
       xScroll: true,  // Or so slippery
       up:{}, // Pull on the configuration
       down: {}, // The drop-down configuration 
       If you're pulling up and down, you don't have to write LeftRight
       LeftRight: {
           scrollbar: true, // Whether scroll bars need to be hidden truehidden || false no hidden  (The default value true)
           springback: true, // Need to bounce back true bounce || false no bounce  (default true)
           springbackNum: 150, // Maximum rebound range (default 150)(Do not write without bouncing back)
           // this.onScrolls£¨scroll, scrollLeft£¬£©scroll: The object itself, scrollLeft: Scroll bar distance
            onScroll: this.onScrolls
            },
     })
