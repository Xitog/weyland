// -----------------------------------------------------------
// MIT Licence (Expat License Wording)
// -----------------------------------------------------------
// Copyright © 2020, Damien Gouteux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// For more information about my projects see:
// https://xitog.github.io/dgx (in French)

//-------------------------------------------------------------------------------
// Imports
//-------------------------------------------------------------------------------

import fs from 'fs';

//-----------------------------------------------------------------------------
// Classes
//-----------------------------------------------------------------------------

// Tagged lines

class Line
{
    constructor(value, type)
    {
        this.value = value;
        this.type = type;
    }

    toString()
    {
        return `${this.type} |${this.value}|`;
    }
}

// Document nodes

class EmptyNode {}
class Node extends EmptyNode
{
    constructor(content=null)
    {
        super();
        this.content = content;
    }

    toString()
    {
        if (this.content === null)
        {
            return this.constructor.name;
        } else {
            return this.constructor.name + " { content: " + this.content + " }";
        }
    }
}
class Text extends Node {}
class Start extends Node {}
class Stop extends Node {}
class HR extends EmptyNode {}
class Span extends EmptyNode
{
    constructor(ids, cls, text)
    {
        super();
        this.ids = ids;
        this.cls = cls;
        this.text = text;
    }

    to_html()
    {
        let r = "<span"
        if (this.ids !== null)
        {
            r += ` id="${this.ids}"`;
        }
        if (this.cls !== null)
        {
            r += ` class="${this.cls}"`;
        }
        r += `>${this.text}</span>`;
        return r;
    }
}
class ParagraphIndicator extends EmptyNode
{
    constructor(ids, cls)
    {
        super();
        this.ids = ids;
        this.cls = cls;
    }

    to_html()
    {
        let r = "<p"
        if (this.ids !== null)
        {
            r += ` id="${this.ids}"`;
        }
        if (this.cls !== null)
        {
            r += ` class="${this.cls}"`;
        }
        r+= ">";
        return r;
    }
}
class Comment extends Node {}
class Row extends EmptyNode
{
    constructor(node_list_list)
    {
        super();
        this.node_list_list = node_list_list;
        this.is_header = false;
    }
}
class RawHTML extends Node {}
class Include extends Node {}
class Title extends Node
{
    constructor(content, level)
    {
        super(content);
        this.level = level;
    }
}
class StartDiv extends EmptyNode
{
    constructor(id, cls)
    {
        super();
        this.id = id;
        this.cls = cls;
    }
}
class EndDiv extends EmptyNode {}
class Composite extends EmptyNode
{
    constructor()
    {
        super(null);
        this.children = [];
    }
    add_child(o)
    {
        this.children.push(o);
    }
    add_children(ls)
    {
        this.children = this.children.concat(ls);
    }
}
class TextLine extends Composite
{
    constructor(children=[])
    {
        super();
        this.add_children(children);
    }
}
class ListItem extends Composite
{
    constructor(ordered=false, reverse=false, level=0, children=[])
    {
        super();
        this.add_children(children);
        this.level = level;
        this.ordered = ordered;
        this.reverse = reverse;
    }
}
// [[label]] (you must define somewhere ::label:: https://) display = url
// [[https://...]] display = url
// [[display->label]] (you must define somewhere ::label:: https://)
// [[display->https://...]]
class Link extends EmptyNode
{
    constructor(url, display)
    {
        super();
        this.url = url;
        this.display = display; // list of nodes
    }
}
class Definition extends Node
{
    constructor(header, content)
    {
        super(content);
        this.header = header;
    }
}
class GetVar extends Node {}
class SetVar extends EmptyNode
{
    constructor(id, value, type, constant)
    {
        super();
        this.id = id;
        this.value = value;
        this.type = type;
        this.constant = constant;
    }
}
class Markup extends Node {}

// Variable & document

class Variable
{
    constructor(document, name, type, constant=false, value=null)
    {
        this.document = document;
        this.name = name;
        if (type !== 'number' && type !== 'string' && type !== 'boolean')
        {
            throw new Error(`Unknown type ${type} for variable ${name}`);
        }
        this.type = type;
        this.constant = constant;
        this.value = value;
    }

    set_variable(value)
    {
        if (this.value !== null && this.constant)
        {
            throw new Error(`Can't set the value of the already defined constant: ${this.name} of type ${this.type}`);
        }
        if ((isNaN(value) && this.type === 'number') ||
            (typeof value === 'string' && this.type !== 'string') ||
            (typeof value === 'boolean' && this.type !== 'boolean'))
        {
            throw new Error(`Cant't set the value to ${value} for variable ${this.name} of type ${this.type}`);
        }
        this.value = value;
    }

    get_value()
    {
        if (this.name === 'NOW')
        {
            return new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        else
        return this.value;
    }
}

class Document
{
    constructor(name=null)
    {
        this.name = name;
        this.variables = {
            'VERSION': new Variable(this, 'VERSION', 'string', 'true', 'Hamill 2.0'),
            'NOW': new Variable(this, 'NOW', 'string', 'true', ''),
            'PARAGRAPH_DEFINITION': new Variable(this, 'PARAGRAPH_DEFINITION', 'boolean', false, false)
        };
        this.required = [];
        this.css = [];
        this.labels = {};
        this.nodes = [];
    }

    set_name(name)
    {
        this.name = name;
    }

    to_html_file(output_directory)
    {
        let parts = this.name.split('/');
        let outfilename = parts[parts.length - 1];
        outfilename = outfilename.substring(0, outfilename.lastIndexOf('.hml')) + '.html';
        let sep = output_directory[output_directory.length - 1] === '/' ? '' : '/';
        let target = output_directory + sep + outfilename;
        fs.writeFileSync(target, this.to_html());
        console.log('Outputting in:', target);
    }

    set_variable(k, v, t='string', c=false)
    {
        if (k in this.variables)
        {
            this.variables[k].set_variable(v);
        }
        else
        {
            this.variables[k] = new Variable(this, k, t, c, v);
        }
    }

    get_variable(k, default_value=null)
    {
        if (k in this.variables)
        {
            return this.variables[k].get_value();
        }
        else if (default_value !== null)
        {
            return default_value;
        }
        else
        {
            console.log('Dumping variables:');
            for (const [k, v] of Object.entries(this.variables))
            {
                console.log('   ', v.name, '=', v.value);
            }
            throw new Error(`Unknown variable: ${k}`);
        }
    }

    add_required(r)
    {
        this.required.push(r);
    }

    add_css(c)
    {
        this.css.push(c);
    }

    add_label(l, v)
    {
        this.labels[l] = v;
    }

    add_node(n)
    {
        this.nodes.push(n);
    }

    get_node(i)
    {
        return this.nodes[i];
    }

    get_label(target)
    {
        if (! (target in this.labels))
        {
            for (const label in this.labels)
            {
                console.log(label);
            }
            throw new Error("Label not found : " + target);
        }
        return this.labels[target];
    }

    make_anchor(text)
    {
        return text.toLocaleLowerCase().replace(/ /g, '-');
    }

    string_to_html(content, nodes)
    {
        if (typeof content !== 'string') throw new Error('Parameter content should be of type string');
        if (!Array.isArray(nodes) || (!(nodes[0] instanceof Start)
            && !(nodes[0] instanceof Stop) && !(nodes[0] instanceof Text)
            && !(nodes[0] instanceof Link) && !(nodes[0] instanceof GetVar))
            && !(nodes[0] instanceof ParagraphIndicator)) throw new Error(`Parameter nodes should be an array of Start|Stop|Text|Link|GetVar and is: ${typeof nodes[0]}`);
        for (let node of nodes)
        {
            let markups = {
                'bold': 'b',
                'italic': 'i',
                'stroke': 's',
                'underline': 'u',
                'sup': 'sup',
                'sub': 'sub'
            }
            if (node instanceof Start)
            {
                content += `<${markups[node.content]}>`;
            }
            else if (node instanceof Stop)
            {
                content += `</${markups[node.content]}>`;
            }
            else if (node instanceof Text)
            {
                content += node.content;
            }
            else if (node instanceof Link)
            {
                let url = node.url;
                let display = this.string_to_html('', node.display);
                if (!url.startsWith('https://') && !url.startsWith('http://'))
                {
                    if (url === '#')
                    {
                        url = this.get_label(this.make_anchor(display));
                    }
                    else
                    {
                        url = this.get_label(url);
                    }
                }
                if (display === undefined || display === null)
                {
                    display = url;
                }
                content += `<a href="${url}">${display}</a>`;
            }
            else if (node instanceof GetVar)
            {
                content += this.get_variable(node.content);
            }
            else if (node instanceof Span)
            {
                content += node.to_html();
            }
            else if (node instanceof ParagraphIndicator)
            {
                let ret = content.lastIndexOf("<p>");
                content = content.substring(0, ret) + node.to_html() + content.substring(ret + 3);
            }
            else
            {
                throw new Error("Impossible to handle this type of node: " + node.constructor.name);
            }
        }
        return content;
    }

    assure_list_consistency(content, stack, level, ordered, reverse)
    {
        //console.log('lvl', level, 'len', stack.length);
        if (level > stack.length)
        {
            while (level > stack.length)
            {
                let starter = (stack.length > 0) ? "\n" : "";
                stack.push({'ordered': ordered, 'reverse': reverse, 'level': stack.length + 1});
                if (ordered && reverse)
                {
                    content += starter + "  ".repeat(level * 2) + "<ol reversed>";
                    content += "\n" + "  ".repeat(level * 2 + 1) + "<li>";
                }
                else if (ordered)
                {
                    content += starter + "  ".repeat(level * 2) + "<ol>";
                    content += "\n" + "  ".repeat(level * 2 + 1) + "<li>";
                }
                else
                {
                    content += starter + "  ".repeat(level * 2) + "<ul>";
                    content += "\n" + "  ".repeat(level * 2 + 1) + "<li>";
                }
            }
        }
        else if (level < stack.length)
        {
            while (level < stack.length)
            {
                let o = stack.pop();
                if (o['ordered'])
                {
                    content += "</li>\n" + "  ".repeat(o['level'] * 2) + "</ol>\n";
                    if (stack.length > 0)
                    {
                        content += "  ".repeat(o['level'] * 2 - 1) + "</li>\n";
                        if (level !== 0) content += "  ".repeat(o['level'] * 2 - 1) + "<li>";
                    }
                }
                else
                {
                    content += "</li>\n" + "  ".repeat(o['level'] * 2) + "</ul>\n";
                    if (stack.length > 0)
                    {
                        content += "  ".repeat(o['level'] * 2 - 1) + "</li>\n";
                        if (level !== 0) content += "  ".repeat(o['level'] * 2 - 1) + "<li>";
                    }
                }
            }
        }
        else
        {
            content += "</li>\n" + "  ".repeat(level * 2 + 1) + "<li>";
        }
        return content;
    }

    to_html(header=true, discard_comment=true)
    {
        let start_time = new Date();
        let content = '';
        if (header)
        {
            content = `<html lang="${this.get_variable('LANG', 'en')}">
<head>
  <meta charset=utf-8>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${this.get_variable('TITLE', 'Undefined title')}</title>
  <link rel="icon" href="${this.get_variable('ICON', 'Undefined icon')}" type="image/x-icon" />
  <link rel="shortcut icon" href="https://xitog.github.io/dgx/img/favicon.ico" type="image/x-icon" />\n`;
            // For CSS
            if (this.required.length > 0)
            {
                for (let req of this.required)
                {
                    if (req.endsWith('.css'))
                    {
                        content += `  <link href="${req}" rel="stylesheet">\n`;
                    }
                }
            }
            if (this.css.length > 0)
            {
                content += '  <style type="text/css">\n';
                for (let cs of this.css)
                {
                    content += "    " + cs + "\n";
                }
                content += '  </style>\n';
            }
            // For javascript
            if (this.required.length > 0)
            {
                for (let req of this.required)
                {
                    if (req.endsWith('.js'))
                    {
                        content += `  <script src="${req}"></script>\n`;
                    }
                }
            }
            if (header)
            {
                content += "</head>\n";
                content += "<body>\n";
            }
        }
        let first_text = true;
        let not_processed = 0;
        let types_not_processed = [];
        // Table
        let in_table = false;
        // List
        let stack = [];
        // Paragraph
        let in_paragraph = false;
        let in_def_list = false;
        for (const [index, node] of this.nodes.entries())
        {
            //console.log(content.substring(content.indexOf('<body>')));
            console.log(index, node);

            // Consistency
            if (!(node instanceof TextLine) && in_paragraph)
            {
                content += "</p>\n";
                in_paragraph = false;
            }
            if (!(node instanceof ListItem) && stack.length > 0)
            {
                content = this.assure_list_consistency(content, stack, 0, null, null);
            }
            if (!(node instanceof Definition) && in_def_list)
            {
                content += "</dl>\n";
                in_def_list = false;
            }
            if (!(node instanceof Row) && in_table)
            {
                content += "</table>\n";
                in_table = false;
            }

            // Handling of nodes
            if (node instanceof ListItem)
            {
                content = this.assure_list_consistency(content, stack, node.level, node.ordered, node.reverse);
                content = this.string_to_html(content, node.children);
            }
            else if (node.constructor.name === 'EmptyNode')
            {
                // Nothing, it is just too close the paragraph, done above.
            }
            else if (node instanceof Include)
            {
                let file = fs.readFileSync(node.content);
                content += file + "\n";
            }
            else if (node instanceof Title)
            {
                content += `<h${node.level} id="${this.make_anchor(node.content)}">${node.content}</h${node.level}>\n`;
            }
            else if (node instanceof Comment)
            {
                if (!discard_comment)
                {
                    content += '<!-- ' + node.content + ' -->\n';
                }
            }
            else if (node instanceof SetVar)
            {
                this.set_variable(node.id, node.value, node.type, node.constant);
            }
            else if (node instanceof HR)
            {
                content += "<hr>\n";
            }
            else if (node instanceof StartDiv)
            {
                if (node.id !== null && node.cls !== null)
                {
                    content += `<div id="${node.id}" class="${node.cls}">\n`;
                }
                else if (node.id !== null)
                {
                    content += `<div id="${node.id}">\n`;
                }
                else if (node.cls !== null)
                {
                    content += `<div class="${node.cls}">\n`;
                }
                else
                {
                    content += '<div>\n';
                }
            }
            else if (node instanceof EndDiv)
            {
                content += "</div>\n";
            }
            else if (node instanceof RawHTML)
            {
                content += node.content + "\n";
            }
            else if (node instanceof TextLine)
            {
                if (!in_paragraph)
                {
                    in_paragraph = true;
                    content += "<p>";
                } else {
                    content += "<br>\n";
                }
                content = this.string_to_html(content, node.children);
            }
            else if (node instanceof Definition)
            {
                if (!in_def_list)
                {
                    in_def_list = true;
                    content += "<dl>\n";
                }
                content += '<dt>';
                content = this.string_to_html(content, node.header) + "</dt>\n";
                content += '<dd>'
                if (this.get_variable('PARAGRAPH_DEFINITION') === true) content += '<p>';
                content = this.string_to_html(content, node.content);
                if (this.get_variable('PARAGRAPH_DEFINITION') === true) content += '</p>';
                content += '</dd>\n';
            }
            else if (node instanceof Row)
            {
                if (!in_table)
                {
                    in_table = true;
                    content += "<table>\n";
                }
                content += "<tr>";
                let delim = node.is_header ? 'th' : 'td';
                for (let node_list of node.node_list_list)
                {
                    content += `<${delim}>`;
                    content = this.string_to_html(content, node_list);
                    content += `</${delim}>`;
                }
                content += "</tr>\n";
            }
            else
            {
                console.log(index, node);
                not_processed += 1;
                if (!(node.constructor.name in types_not_processed))
                {
                    types_not_processed[node.constructor.name] = 0;
                }
                types_not_processed[node.constructor.name] += 1;
            }
        }
        if (in_paragraph)
        {
            content += "</p>\n";
            in_paragraph = false;
        }
        if (stack.length > 0)
        {
            content = this.assure_list_consistency(content, stack, 0, null, null);
        }
        if (in_table)
        {
            content += "</table>\n";
        }
        if (!first_text)
        {
            content += "</p>\n";
        }
        if (header)
        {
            content += "\n  </body>\n</html>";
        }
        console.log('\nNodes processed:', this.nodes.length - not_processed, '/', this.nodes.length);
        if (not_processed > 0)
        {
            console.log(`Nodes not processed ${not_processed}:`);
            for (let [k, v] of Object.entries(types_not_processed))
            {
                console.log('   -', k, v);
            }
        }
        let end_time = new Date();
        let elapsed = (end_time - start_time)/1000;
        console.log('Processed in:        %ds', elapsed, '\n');
        return content;
    }

    info()
    {
        console.log('\n------------------------------------------------------------------------');
        console.log('Liste des nodes du document');
        console.log('------------------------------------------------------------------------\n');
        for (const [index, node] of this.nodes.entries())
        {
            console.log(index, node.toString());
        }
    }
}

class Hamill
{
     // Read a file and produce a big string
    static read_file(filename, encoding='utf8')
    {
        let data;
        try
        {
            data = fs.readFileSync(filename, encoding);
        }
        catch (err)
        {
                throw new Error(err);
        }
        return data;
    }

    static split_lines(data)
    {
        let lines = data.replace(/\r\n/g, "\n").replace(/\n\r/g, "\n").replace(/\r/g, "\n").split("\n");
        return lines;
    }

    static tag_lines(raw)
    {
        let lines = [];
        let next_is_def = false;
        for (const [index, value] of raw.entries())
        {
            let trimmed = value.trim();
            if (trimmed.length === 0)
            {
                lines.push(new Line('', 'empty'));
            }
            else if (trimmed[0] === '#')
            {
                lines.push(new Line(trimmed, 'title'));
            }
            else if ((trimmed.match(/-/g)||[]).length === trimmed.length)
            {
                lines.push(new Line('', 'separator'));
            }
            else if (trimmed.substring(0, 2) === '* ')
            {
                lines.push(new Line(value, 'unordered_list'));
            }
            else if (trimmed.substring(0, 2) === '+ ')
            {
                lines.push(new Line(value, 'ordered_list'));
            }
            else if (trimmed.substring(0, 2) === '- ')
            {
                lines.push(new Line(value, 'reverse_list'));
            }
            else if (trimmed.startsWith('!var '))
            {
                lines.push(new Line(trimmed, 'var'));
            }
            else if (trimmed.startsWith('!const '))
            {
                lines.push(new Line(trimmed, 'const'));
            }
            else if (trimmed.startsWith('!include '))
            {
                lines.push(new Line(trimmed, 'include'));
            }
            else if (trimmed.startsWith('!require '))
            {
                lines.push(new Line(trimmed, 'require'));
            }
            else if (trimmed.startsWith('!css '))
            {
                lines.push(new Line(trimmed, 'css'));
            }
            else if (trimmed.startsWith('!html'))
            {
                lines.push(new Line(trimmed, 'html'));
            }
            else if (trimmed.substring(0, 2) === '//')
            {
                lines.push(new Line(trimmed, 'comment'));
            }
            else if (trimmed.substring(0, 2) === '::')
            {
                lines.push(new Line(trimmed, 'label'));
            }
            else if (trimmed.substring(0, 2) === '{{' && trimmed.substring(trimmed.length - 2) === '}}')
            {
                // Si la ligne entière est {{ }}, c'est une div... on ne fait pas de span d'une ligne...
                lines.push(new Line(trimmed, 'div'));
            }
            else if (trimmed[0] === '|' && trimmed[trimmed.length - 1] === '|')
            {
                lines.push(new Line(trimmed, 'row'));
            }
            else if (trimmed.substring(0, 2) === '$ ')
            {
                lines.push(new Line(trimmed.substring(2), 'definition-header'));
                next_is_def = true;
            }
            else
            {
                if (!next_is_def)
                {
                    lines.push(new Line(trimmed, 'text'));
                }
                else
                {
                    lines.push(new Line(trimmed, 'definition-content'));
                    next_is_def = false;
                }
            }
        }
        return lines;
    }

    static process_string(data)
    {
        let raw = Hamill.split_lines(data);
        let lines = Hamill.tag_lines(raw);
        if (DEBUG)
        {
            console.log('Lines:');
            for (const [index, line] of lines.entries())
            {
                console.log(`${index}: ${line}`);
            }
            console.log();
        }
        let doc = Hamill.process_lines(lines);
        return doc;
    }

    // Take a filename, return a list of tagged lines, output the result in a file
    static process_file(filename)
    {
        if (DEBUG)
        {
            console.log('Processing file:', filename);
            console.log('--------------------------------------------------------------------------');
        }
        let data = Hamill.read_file(filename);
        let doc = this.process_string(data);
        doc.set_name(filename);
        return doc;
    }

    // Take a list of tagged lines return a valid Hamill document
    static process_lines(lines)
    {
        if (DEBUG) console.log(`Processing ${lines.length} lines`);
        let doc = new Document();
        let definition = null;
        for (const [index, line] of lines.entries())
        {
            let text = undefined;
            let id = undefined;
            let value = undefined;
            switch (line.type)
            {
                case 'title':
                    let lvl = 0;
                    for (const char of line.value)
                    {
                        if (char === '#')
                        {
                            lvl += 1;
                        }
                        else
                        {
                            break;
                        }
                    }
                    text = line.value.substring(lvl+1).trim();
                    doc.add_node(new Title(text, lvl));
                    doc.add_label(doc.make_anchor(text), '#' + doc.make_anchor(text));
                    break;
                case 'separator':
                    doc.add_node(new HR());
                    break;
                case 'text':
                    let n = Hamill.process_inner_string(line.value);
                    doc.add_node(new TextLine(n));
                    break;
                case 'unordered_list':
                case 'ordered_list':
                case 'reverse_list':
                    let ordered = false;
                    let reverse = false;
                    if (line.type === 'unordered_list')
                    {
                        // Nothing
                    }
                    else if (line.type === 'ordered_list')
                    {
                        ordered = true;
                    }
                    else if (line.type === 'reverse_list')
                    {
                        ordered = true;
                        reverse = true;
                    }
                    let delimiters = {'unordered_list': '* ', 'ordered_list': '+ ', 'reverse_list': '- '};
                    let delimiter = delimiters[line.type];
                    let list_lvl = Math.floor(line.value.indexOf(delimiter) / 2) + 1;
                    let list_text = line.value.substring(line.value.indexOf(delimiter) + 2).trim();
                    let list_nodes = Hamill.process_inner_string(list_text);
                    doc.add_node(new ListItem(ordered, reverse, list_lvl, list_nodes));
                    break;
                case 'html':
                    doc.add_node(new RawHTML(line.value.replace('!html ', '').trim()));
                    break;
                case 'css':
                    text = line.value.replace('!css ', '').trim();
                    doc.add_css(text);
                    break;
                case 'include':
                    let include = line.value.replace('!include ', '').trim();
                    doc.add_node(new Include(include));
                    break;
                case 'require':
                    text = line.value.replace('!require ', '').trim();
                    doc.add_required(text);
                    break;
                case 'const':
                    text = line.value.replace('!const ', '').split('=');
                    id = text[0].trim();
                    value = text[1].trim();
                    doc.set_variable(id, value, 'string', true);
                    break;
                case 'var':
                    text = line.value.replace('!var ', '').split('=');
                    id = text[0].trim();
                    value = text[1].trim();
                    if (value === 'true') value = true;
                    if (value === 'TRUE') value = true;
                    if (value === 'false') value = false;
                    if (value === 'FALSE') value = false;
                    let type = 'string';
                    if (typeof value === 'boolean')
                    {
                        type = 'boolean';
                    }
                    doc.add_node(new SetVar(id, value, type, false));
                    break;
                case 'label':
                    value = line.value.replace(/::/, '').trim();
                    text = value.split('::');
                    let label = text[0].trim();
                    let url = text[1].trim();
                    doc.add_label(label, url);
                    break;
                case 'div':
                    value = line.value.substring(2, line.value.length - 2).trim();
                    let res = Hamill.process_inner_markup(value);
                    if (res['has_only_text'] && res['text'] === 'end')
                    {
                        doc.add_node(new EndDiv());
                    }
                    else if (res['has_only_text'])
                    {
                        console.log(res);
                        throw new Error(`Unknown quick markup: ${res['text']} in ${line}`);
                    }
                    else
                    {
                        doc.add_node(new StartDiv(res['id'], res['class']));
                    }
                    break;
                case 'comment':
                    doc.add_node(new Comment(line.value));
                    break;
                case 'row':
                    let content = line.value.substring(1, line.value.length - 1);
                    if (content.length === (content.match(/-/g) || []).length)
                    {
                        let i = doc.nodes.length - 1;
                        while (doc.get_node(i) instanceof Row)
                        {
                            doc.get_node(i).is_header = true;
                            i -= 1;
                        }
                    }
                    else
                    {
                        let parts = content.split('|'); // Handle escape
                        let all_nodes = [];
                        for (let p of parts)
                        {
                            let nodes = Hamill.process_inner_string(p);
                            all_nodes.push(nodes);
                        }
                        doc.add_node(new Row(all_nodes));
                    }
                    break;
                case 'empty':
                    doc.add_node(new EmptyNode());
                    break;
                case 'definition-header':
                    definition = Hamill.process_inner_string(line.value);
                    break;
                case 'definition-content':
                    if (definition === null)
                    {
                        throw new Error('Definition content without header: ' + line.value);
                    }
                    doc.add_node(new Definition(definition, Hamill.process_inner_string(line.value)));
                    definition = null;
                    break;
                default:
                    throw new Error(`Unknown ${line.type}`);
            }
        }
        return doc;
    }

    static process_inner_string(str)
    {
        let in_sup = false;
        let in_sub = false;
        let in_bold = false;
        let in_italic = false;
        let in_underline = false;
        let in_stroke = false;
        let index = 0;
        let word = '';
        let nodes = [];
        while (index < str.length)
        {
            let char = str[index];
            let next = (index + 1 < str.length) ? str[index + 1] : null;
            if (char === '*' && next === '*')
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                if (!in_bold)
                {
                    in_bold = true;
                    nodes.push(new Start('bold'))
                }
                else
                {
                    in_bold = false;
                    nodes.push(new Stop('bold'));
                }
                index += 1;
            }
            else if (char === "'" && next === "'")
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                if (!in_italic)
                {
                    in_italic = true;
                    nodes.push(new Start('italic'))
                }
                else
                {
                    in_italic = false;
                    nodes.push(new Stop('italic'));
                }
                index += 1;
            }
            else if (char === '_' && next === '_')
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                if (!in_underline)
                {
                    in_underline = true;
                    nodes.push(new Start('underline'))
                }
                else
                {
                    in_underline = false;
                    nodes.push(new Stop('underline'));
                }
                index += 1;
            }
            else if (char === '-' && next === '-')
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                if (!in_stroke)
                {
                    in_stroke = true;
                    nodes.push(new Start('stroke'))
                }
                else
                {
                    in_stroke = false;
                    nodes.push(new Stop('stroke'));
                }
                index += 1;
            }
            else if (char === '^' && next === '^')
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                if (!in_sup)
                {
                    in_sup = true;
                    nodes.push(new Start('sup'));
                }
                else
                {
                    in_sup = false;
                    nodes.push(new Stop('sup'));
                }
                index += 1;
            }
            else if (char === '%' && next === '%')
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                if (!in_sub)
                {
                    in_sub = true;
                    nodes.push(new Start('sub'));
                }
                else
                {
                    in_sub = false;
                    nodes.push(new Stop('sub'));
                }
                index += 1;
            }
            else if (char === '{' && next === '{')
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                let end = str.indexOf('}}', index);
                let content = str.substring(index+2, end);
                let res = Hamill.process_inner_markup(content);
                if (res['has_text'])
                {
                    nodes.push(new Span(res['id'], res['class'], res['text']));
                }
                else
                {
                    nodes.push(new ParagraphIndicator(res['id'], res['class']));
                }
                index = end + 1;
            }
            else if (char === '[' && next === '[')
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                let end = str.indexOf(']]', index);
                let content = str.substring(index+2, end);
                let parts = content.split('->');
                let display = undefined;
                let url = undefined;
                if (parts.length === 1)
                {
                    url = parts[0].trim();
                }
                else if (parts.length === 2)
                {
                    display = Hamill.process_inner_string(parts[0].trim());
                    url = parts[1].trim();
                }
                nodes.push(new Link(url, display));
                index = end + 1;
            }
            else if (char === '$' && next === '$')
            {
                if (word.length > 0)
                {
                    nodes.push(new Text(word));
                    word = '';
                }
                let end = str.indexOf('$$', index+2);
                let content = str.substring(index+2, end);
                nodes.push(new GetVar(content));
                index = end + 1;
            }
            else
            {
                word += char;
            }
            index += 1;
        }
        if (word.length > 0)
        {
            nodes.push(new Text(word));
            word = '';
        }
        return nodes;
    }


    static process_inner_markup(content)
    {
        let cls = null;
        let in_class = false;
        let ids = null;
        let in_ids = false;
        let text = null;
        let in_text = false;
        for (let c of content)
        {
            if (c === '.' && in_class === false && in_ids === false && in_text === false && cls === null && text === null)
            {
                in_class = true;
                cls = '';
                continue;
            }
            else if (c === '.')
            {
                throw new Error(`Class or text already defined for this markup: ${content}`);
            }

            if (c === '#' && in_class === false && in_ids === false && in_text === false && ids === null && text === null)
            {
                in_ids = true;
                ids = '';
                continue;
            }
            else if (c === '#')
            {
                throw new Error(`ID or text alreay defined for this markup: ${content}`);
            }

            if (c === ' ' && in_class)
            {
                in_class = false;
            }

            if (c === ' ' && in_ids)
            {
                in_ids = false;
            }

            if (c !== ' ' && in_class === false && in_ids === false && in_text === false && text === null)
            {
                in_text = true;
                text = '';
            }

            if (in_class)
            {
                cls += c;
            }
            else if (in_ids)
            {
                ids += c;
            }
            else if (in_text)
            {
                text += c;
            }
        }
        let has_text = (text !== null) ? true : false;
        let has_only_text = (has_text && cls === null && ids === null) ? true : false;
        return {'has_text': has_text, 'has_only_text': has_only_text,  'class': cls, 'id': ids, 'text': text};
    }

}

//-------------------------------------------------------------------------------
// Functions
//-------------------------------------------------------------------------------

function tests()
{
    console.log("------------------------------------------------------------------------");
    console.log("Test de process_file (hamill)");
    console.log("------------------------------------------------------------------------\n");

    Hamill.process_file('../../dgx/static/input/informatique/tools_langs.hml').to_html_file('../../dgx/informatique/');
    Hamill.process_file('../../dgx/static/input/index.hml').to_html_file( '../../dgx/');
    console.log(Hamill.process_string("**bonjour**").to_html(false));
}

//-------------------------------------------------------------------------------
// Main
//-------------------------------------------------------------------------------

var DEBUG = false;
tests();