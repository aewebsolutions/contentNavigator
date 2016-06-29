# Content Navigator JQuery plugin
ContentNavigator is a JQuery plugin that generates a table of content or index from a page.

This plugin is realy helful when you have a documentation page, a manual page or whatever another long text. Just call the plugin and a table of content will be created automatically.

## Demos
- Basics examples: https://rawgit.com/aewebsolutions/contentNavigator/master/demos/basic.html
- Indexing : https://rawgit.com/aewebsolutions/contentNavigator/master/demos/indexing.html
- Collapsable : https://rawgit.com/aewebsolutions/contentNavigator/master/demos/collapsable.html

## Features
- Minimum markup required
- Easy to specify blocks of contents and titles
- Titles on table of contents can be collapsables
- Generates ids for URL hashing
- Compatible with multiple instances per page

## Installation

Include JQuery js and plugin’s css and js files in your HTML code.

```html

<script src="/lib/jquery.js"></script> 
<link rel="stylesheet" href="/dist/connav.css" type="text/css" /> 
<script src="/dist/connav.js"></script> 

```

## Usage


Wait until document is ready. Then, you can call the plugin.

```javascript

$(document).ready(function(){

   $('#navigator').contentNavigator();

});

```

### Markup

Some markup is required. You need to add an element for getting the content table.

By default, titles of the content table will be generated from page headings (h2, h3, etc). An easy way to tell plugin where to search is wrapping content inside a "connav-auto-block" classname element.
```html
<div id="navigator"></div>

<div class="connav-auto-block">

  <h2>First Level Title</h2>
  <p>Some text here.</p>
  
  <h3>Second Level Title</h3>
  <p>This item will be nested.</p>
  
  <h2>First Level Title. Second one</h2>
  <p>Some text here.</p>
  
  <h3>Second Level Title</h3>
  <p>etc</p>
  
</div>
```

Sometimes you need to get more controll over each block of content or you don't want to use headlings. So, you can use default classes for blocks of content and titles: "connav-block" and "connav-title", or use your custom ones.
```html
<div id="navigator"></div>

<div class="connav-block">
  <div class="connav-title">Here is a first level title</div>
  <p>Some text here.</p>
</div>

<div class="connav-block">
  <div class="connav-title">Here is another first level title</div>
  <p>Some text here.</p>
  
  <div class="connav-block">
    <div class="connav-title">Here is a second level title</div>
    <p>Some text here.</p>
  </div>
</div>
```

For more details, you can see the demos pages.


## Options

Name | Type | Default | Description
--- | --- | --- | ---
**wrapper** | string | 'body' | CSS selector for a wrapper to find content
**updateURL** | boolean | false | Auto update hash  (if id were defined, or id of parents were defined)
**autoId** | boolean | true | Auto generate id (if no one were defined)
**autocontent** | string | 'connav-auto-block' | CSS selector for auto content generator.
**content** | string | 'connav-block' | CSS selector for content blocks. Use it when autocontent is not used.
**title** | string | 'connav-title' | CSS selector for titles. Use it when autocontent is not used. If is not defined, h2, h3, h4, etc will be use. For level 1 use h2; for level 2 use h3; etc.
**indexOnTable** | boolean | true | Shows index on table
**indexOnContent** | boolean | false | Shows index on title content
**indexType** | string | '1.1.1' | E.g : 'A.1.a', ' .1.1'
**nestedIndex** | boolean | true | Each index will be have parents' index, so result will be '2.1.a' instead of just 'a'
**marginTop** | number | 0 | Space between top of screen and block
**btnCollapse** | string | '<div class="connav-btn-collapse"></div>' | Markup for collpse button
**collapsable** | boolean | false | Makes items collapsable 
**autocollapse** | boolean | false | Auto toggle collapsable items of table of content when scrolling.


## Events

Event | Params | Description
--- | --- | ---
**connavReady** | event , instance| Fires when table is ready
**connavChange** | event, activeBlock | Fires when a block is activated
**connavToggleCollapse** | event, tableNode | Fires when an item form table of content is open or close



