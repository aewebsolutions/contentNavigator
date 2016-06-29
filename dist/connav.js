/**
 * ContentNavigator Jquery Plugin
 * This plugin generates a table of content from blocks of content in document.
 * Usage : $('#wrapper-for-navigator').contentNavigator(options)
 * Events : 
 *      connavReady(event, instance)
 *      connavChange(event, activeBlock)
 *      connavToggleCollapse(event, tableNode)
 */
;
(function ($) {
    
function ContentNavigator(el, options){
    
    /*
     |------------------------------------------------------------------------
     | Private properties
     |------------------------------------------------------------------------
     */
    
    var self = this,
        body = $('body'),
        $window = $(window),
        isGoingTo = false,
        prefix = 'connav';

    var isResizing;

    var defaults = {
        wrapper : 'body',
        updateURL : false, //auto update hash  (if id were defined, or id of parents were defined)
        autoId : true, //auto generate id (if no one were defined)
        content: '.'+prefix+'-block', //CSS selector for content blocks
        autocontent : '.'+prefix+'-auto-block', //CSS selector for auto content generator
        title : '', //CSS selector for title of content blocks. If is not defined, h2, h3, h4, etc will be use. For level 1 use h2; for level 2 use h3; etc.
        indexOnTable : true, //for show index on table
        indexOnContent : false, //for show index on content
        indexType : '1.1.1', //e.g : 'A.1.a', ' .1.1'
        nestedIndex : true, //each index will be parents' index. The result will be lile: '2.1.a' instead of 'a'
        marginTop : 0, //space between top of screen and block
        btnCollapse : '<div class="'+prefix+'-btn-collapse"></div>', //Also, false or null
        autocollapse : false, // auto toggle collapse on scrolling.
        collapsable : false
    }
    
    
    /*
     |------------------------------------------------------------------------
     | Public properties
     |------------------------------------------------------------------------
     */
    
    this.el = el instanceof $ ? el : $(el);
    this.wrapper;
    this.contentBlocks;
    this.table = $('<div>', {class: prefix+'-table-content'});
    this.indexTypes = [];
    this.tree = [];
    this.blocksByLevel = [];
    this.blocks = [];

    this.settings = $.extend(true, {}, defaults, options);

    /*
     |------------------------------------------------------------------------
     | Private methods
     |------------------------------------------------------------------------
     */
    
    /**
     * Init instance
     * 
     * @returns void
     */
    var init = function(){
        self.wrapper = $(self.settings.wrapper);
        setIndexType();
        createBlocks();
        setBlocks();
        self.addToTree();
        setTable();
        if(self.settings.collapsable)
            collapsable();
        
        if(self.settings.autoId)
            generateIds();
        if(window.location.hash){
            var node = $(window.location.hash);
            if(node.length && node.data(prefix+'-block'))
                self.goTo(node.data(prefix+'-block'))
        }
        
        $window.on('scroll', onScrolling);
        $window.on('resize', onResizing);
        
        self.updateBounderies();
        
        self.el.trigger(prefix+'Ready', self);
    };
    
    var setTable = function(){
        self.el.append(self.table);
    };
    
    var onResizing = function(){
        //if element does not exists in document, return.
        if(!document.body.contains(self.el[0]))
            return;
        
        //Fire once.
        if(isResizing)
            clearTimeout(isResizing);
        
        isResizing = setTimeout(function(){
            self.contentBlocks.each(function () {
                var block = $(this).data(prefix + '-block');
                self.setBounderies(block);
            });
        }, 500)

    };
    
    var onScrolling = function(){
        if(isGoingTo)
            return;
        
        //if element does not exists in document, break.
        if(!document.body.contains(self.el[0]))
            return;
        
        var scrollTop = body.scrollTop();
        
        for(var i = self.blocksByLevel.length - 1; i >= 0 ; i--){
            for(var j = 0, k = self.blocksByLevel[i].length; j<k; j++){
                var block = self.blocksByLevel[i][j];
                if(scrollTop > block.offset.top && scrollTop < block.offset.bottom){
                    if(!block.focus){
                        self.desactivate();
                        self.activate(block);
                    }
                    return;
                }
            }
        }
    };
    
    /**
     * Set the index type of tree selected in options. E.g., 1.A.a.1
     * 
     * @returns void
     */
    var setIndexType = function(){
        var types = self.settings.indexType.split('.');
        for(var i = 0, j= types.length; i<j; i++){
            var character = types[i];
            if(parseInt(character) > 0){
               self.indexTypes[i] = 'number' ;
            }else if (character == 0) {
               self.indexTypes[i] = null
            }else if (character == character.toUpperCase()) {
                self.indexTypes[i] = 'uppercase';
            }
            else if (character == character.toLowerCase()){
                self.indexTypes[i] = 'lowercase';
            }
            
        }
    };
    
    /**
     * How to show some index. 
     * 
     * @param string index
     * @param Object parent
     * @returns string parsed index
     */
    var getIndexToShow = function(index, parent){
        var i;
        var level = parent? parent.level : 0;
        switch(self.indexTypes[level]){
            case null : 
                i = '';
                break;
            case 'uppercase' : 
                i = String.fromCharCode(index + 65) + '.';
                break;
            case 'lowercase' :
                i = String.fromCharCode(index + 97) + '.';
                break;
            default : 
                i = (index + 1) + '.';
        }
        if(parent && i != 0 && parent.indexToShow != 0 && self.settings.nestedIndex){
           i = parent.indexToShow + i;
        }
        return i;
    };
    
    /**
     * If a class 'connav-auto-block' exists in wrapper, block will be auto generated. 
     * 
     * @returns void
     */
    var createBlocks = function(){
        var wr = self.wrapper.find(self.settings.autocontent);
        console.log(wr)
        console.log(wr.length)
        if(!wr.length)
            return;
        
        var delimiters = ['h2', 'h3', 'h4', 'h5', 'h6'];
        
        for(var i = 0, j = delimiters.length; i<j ; i++){

            wr.find(delimiters[i]).each(function(){
                $(this).nextUntil(delimiters[i]).andSelf().wrapAll('<div class="'+prefix+'-block"></div>')
            });

        }
    }
    
    /**
     * Set context to all blocks
     * 
     * @returns void
     */
    var setBlocks = function(){
        self.contentBlocks = self.wrapper.find(self.settings.content);
        self.contentBlocks.addClass(prefix+'-block');
        self.contentBlocks.each(function(){
            var  $this = $(this);
            var parents = $this.parents('.'+prefix+'-block');
            $this.addClass(prefix+'-level-'+ (parents.length + 1) );
        });
    };
    
    var generateIds = function(){
        for(var i = 0, j = self.blocks.length; i<j; i++){
            if(!self.blocks[i].node[0].id && self.blocks[i].title != 0){
                var id = parseString(self.blocks[i].title);
                
                //avoid duplicates
                if(document.getElementById(id)){
                    for(var k = 2; k>0 ; k++){
                        if(!document.getElementById(id+'_'+k)){
                            id = id+'_'+k;
                            break;
                        }
                    }
                }
                self.blocks[i].node[0].id = id;
            }
                
        }
    };
    
    var parseString = function(str){
        var str = str.replace(/^\s+|\s+$/g, ''); // trim
        var str = str.toLowerCase();
        var str = str.replace(/^([^abcdefghijklmnopqrstuvwxyz]+)/g, '');

        // remove accents, swap ñ for n, etc
        var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
        var to   = "aaaaaeeeeeiiiiooooouuuunc------";
        for (var i=0, l=from.length ; i<l ; i++) {
          str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        var str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
          .replace(/\s+/g, '_') // collapse whitespace and replace by -
          .replace(/-+/g, '_') // collapse dashes
          .replace(/_*$/g, '')
          .replace(/__+/g, '_');

        return str;
    };
    

    
    var updateURL = function(block){
        if(block.node[0].id){
            console.log(window.location.hash)
            var href = window.location.href.replace(window.location.hash, "");
            window.history.replaceState("", document.title, href+'#'+block.node[0].id);
        }else if(block.parent){
            updateURL(block.parent);
        }
    };
    
    var collapsable = function(){
        if(self.settings.btnCollapse)
        $.each(self.tree, function(i, el){
            addCollapsableTo(el);
        });
    }
    var addCollapsableTo = function(treeElement){

        if(treeElement.children.length){
            var btn = $(self.settings.btnCollapse)
                    .click(function(){
                        self.toggleCollapse(treeElement.tableNode);
                    })
                    .prependTo(treeElement.tableNode.children('.'+prefix+'-table-item-title'));
            
            if(self.settings.autocollapse){
                treeElement.tableNode.addClass('collapsed');
            }

            $.each(treeElement.children, function(i, el){
                addCollapsableTo(el)
            });    
        }
    }
    
    
    /*
     |------------------------------------------------------------------------
     | Public methods
     |------------------------------------------------------------------------
     */
    
    /**
     * (Re)Calculate bounderies. 
     * 
     * @param object block - Item from this.blocks propery array
     * @returns void
     */
    this.setBounderies = function (block) {
        block.offset = {
            top: block.node.offset().top - self.settings.marginTop,
            bottom: block.node.offset().top + block.node.outerHeight() - self.settings.marginTop
        };
    };
    
    this.updateBounderies = function(){
        $.each(self.blocks, function(i, block){
            self.setBounderies(block);
        });
    }
    
    /**
     * Add a node to contents tree or all blocks parsed in DOM.
     * 
     * @param {type} node
     * @param {type} index
     * @param {type} parent
     * @returns {undefined}
     */
    this.addToTree = function(node, index, parent){

        // if there is no given node or if node is itself this.tree, then aply 
        // from top level (it is, add all) and return...
        if(!node || node === self.tree){
            var firstLevel = self.contentBlocks.filter('.'+prefix+'-level-1');
            firstLevel.each(function(index, element){
                var $this = $(this);
                self.addToTree($this, index);
                $this.data(prefix+'-block').tableNode.appendTo(self.table);
            });
            return;
        }
        
        //...if not
        var index = index,
            siblings = parent? parent.children : self.tree,
            parent = parent || null,
            level = node.parents('.'+prefix+'-block').length + 1;
        
        //Index for show
        var indexToShow = getIndexToShow(index, parent);
        
        //Title. If settings.title was defined, then use it. If not, use h2, h3, h4, etc. (for level 1 use h2; for level 2 use h3; etc.)
        var h = node.find('h'+(level+1)),
            t = self.settings.title != 0? node.children(self.settings.title) : false,
            titleText = '';
        if(t && t.length){
            titleText = t.text();
        }else if(h.length){
            titleText = h.text();
        }
        
        //Modify title of Content width 
        if(self.settings.indexOnContent && indexToShow != 0){
            var indexContentNode = '<span class="'+prefix+'-block-index">'+indexToShow+'</span>';
            if(t && t.length){
                t.prepend(indexContentNode);
            }else if(h.length){
                h.prepend(indexContentNode);
            }
        }
        
        //table Node
        var tableNode = $('<div class="'+prefix+'-table-item '+prefix+'-table-level-'+level+'"></div>'),
            indexTableNode = '<span class="'+prefix+'-table-item-index">'+indexToShow+'</span>',
            tableNodeText = $('<span class="'+prefix+'-table-item-text">'+titleText+'</span>'),
            tableNodeTitle = $('<div class="'+prefix+'-table-item-title"></div>');

        if(self.settings.indexOnTable && indexToShow != 0)
            tableNodeTitle.prepend(indexTableNode);
        tableNodeTitle.append(tableNodeText);
        tableNode.append(tableNodeTitle);
        if(parent)
            tableNode.appendTo(parent.tableNode);

        //define block obj
        var block = {
            index : index + 1,
            level : level, 
            node : node, 
            title : titleText, 
            parent: parent, 
            children: [],
            tableNode : tableNode,
            indexToShow : indexToShow,
            focus : false,
            offset : {}
        };
        
        //setBounderies
        self.setBounderies(block);
        
        //add block to tree
        siblings.push(block);
        
        //add block to block property
        self.blocks.push(block);
        
        //add block to blocksByLevel property
        if(!self.blocksByLevel[level - 1])
            self.blocksByLevel[level - 1] = [];
        self.blocksByLevel[level - 1].push(block);
        
        //store block in $.data
        node.data(prefix+'-block', block);
        
        //atatch click event
        tableNodeText.click(function(){
            self.goTo(block);
        });
        
        //apply for all children
        var children = node.children('.'+prefix+'-block');
        children.each(function(i, el){
            var $this = $(this);
            self.addToTree($this, i, block);
        });
    };
    

    
    /**
     * Scroll to a given block.
     * 
     * @param Object block
     * @returns void
     */
    this.goTo = function(block){
        if(isGoingTo)
            return;
        isGoingTo = true;
        $('body, html').animate({scrollTop: block.offset.top}, function(){
            setTimeout(function(){
                isGoingTo = false;
            }, 50);
        });
        self.desactivate();
        self.activate(block);
    };
    
    this.desactivate = function(){
        var active = self.table.find('.active');
        
        //Collapse all elements active
        if(self.settings.btnCollapse && self.settings.autocollapse)
            self.closeCollapse(active);
        
        //Remove active and focus classes
        active.removeClass('active').removeClass('focus');
        for(var i=0, j = self.blocks.length; i<j ; i++){
            if(self.blocks[i].focus)
               self.blocks[i].focus = false; 
        }
    };
    
    this.activate = function(block, noFocus){
        
        if(!noFocus){
            block.focus = true;
            block.tableNode.addClass('focus');
            
            //Update URL
            if(self.settings.updateURL && window.history.replaceState)
                updateURL(block);
            
            //Trigger event connavChange
            self.el.trigger(prefix+'Change', block)
        }
        
        block.tableNode.addClass('active');
        if(block.parent)
            self.activate(block.parent, true);
        
        if(self.settings.btnCollapse && self.settings.autocollapse)
            self.openCollapse(block.tableNode);
    };
    
    this.toggleCollapse = function(tableNode){
        if(tableNode.hasClass('collapsed')){
            self.openCollapse(tableNode);
        }else{
            self.closeCollapse(tableNode);
        }
    }
    
    this.openCollapse = function(tableNode){
        tableNode.removeClass('collapsed');
        self.el.trigger(prefix+'ToggleCollapse', tableNode)
        
        setTimeout(self.updateBounderies, 100);
    }
    
    this.closeCollapse = function(tableNode){
        tableNode.addClass('collapsed');
        self.el.trigger(prefix+'ToggleCollapse', tableNode);
        setTimeout(self.updateBounderies, 100);
    }
    
    

    //autoload
    init();
};
    
    //jQuery Plugin
    var pluginName = 'contentNavigator';
    var Plugin = ContentNavigator;

    $.fn[pluginName] = function (options) {
        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, pluginName)) {
                    $.data(this, pluginName, new Plugin(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            if(options === 'instance'){
                return $.data(this[0], pluginName);
            }else
            if (Array.prototype.slice.call(args, 1).length == 0 && $.inArray(options, $.fn[pluginName].getters) != -1) {
                var instance = $.data(this[0], pluginName);
                return instance[options].apply(instance, Array.prototype.slice.call(args, 1));
            } else {
                return this.each(function () {
                    var instance = $.data(this, pluginName);
                    if (instance instanceof Plugin && typeof instance[options] === 'function') {
                        instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                    }
                });
            }
        }
    };
    $.fn[pluginName].getters = [];

})(jQuery);
