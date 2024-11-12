function md_parse(text) {
    function split_nyn(text, pattern) {
        let matched = text.match(pattern);
        let not_matched = text.split(pattern);
        if (matched === null) matched = [];
        console.assert(matched.length + 1 === not_matched.length);
        for (let i = matched.length; i >= 0; i--) {
            matched.splice(i, 0, not_matched[i]);
        }
        return matched;
    }
    function md_parse_text(text) {
        return text
            .replace(/`([^`]+)`/g, '<span style="display: inline; color-scheme: light; visibility: inherit; line-height: 1.25rem; white-space: pre-wrap; word-break: break-word; word-wrap: break-word; font-feature-settings: liga 0; font-variant-ligatures: no-contextual; background: transparent; outline: 0; vertical-align: baseline; font-family: Roboto Mono,monospace; background-color: #fafafa; border: 1px solid; color: #424242; margin: 0 2px; padding: 1px 7px; font-size: .75rem;">$1</span>')
            .replace(/\*\*\*([^*](?:(?:(?!\*\*\*).)*[^*])?)\*\*\*/g, '<b><i>$1</i></b>')
            .replace(/\*\*([^*](?:(?:(?!\*\*).)*[^*])?)\*\*/g, '<b>$1</b>')
            .replace(/\*([^*](?:(?:(?!\*).)*[^*])?)\*/g, '<i>$1</i>')
            .replace(/(https?:\/\/[-a-zA-Z0-9_./?=&#+]+)/g, '<a href=$1>$1</a>');
    }
    function split_html_tags(text) {
        text = split_nyn(text, /<(?:(?:[a-zA-Z]+ [^>]+)|(?:\/?[a-zA-Z]))>/sg)
        // console.log('split_html_tags('+text.length+'):'+text);
        for (let i = 0; i < text.length; i += 2) {
            text[i] = md_parse_text(text[i]);
        }
        return text.join('');
    }
    function split_md_link(text) {
        text = split_nyn(text, /\[[^\]]+\]\([^)]+\)/g);
        for (let i = 1; i < text.length; i += 2) {
            let s = text[i].split('](');
            s = [s[0].substring(1), s[1].substring(0, s[1].length - 1)];
            text[i] = '<a href=' + s[1] + '>' + split_html_tags(s[0]) + '</a>';
        }
        for (let i = 0; i < text.length; i += 2) {
            text[i] = split_html_tags(text[i]);
        }
        return text.join('');
    }
    function md_parse_sentence(text) {
        // console.log('md_parse_sentence:'+text);
        text = text
            .replace(/\\&/g, '&amp;')
            .replace(/\\</g, '&lt;')
            .replace(/\\>/g, '&gt;')
            .replace(/\\"/g, '&quot;')
            .replace(/\\'/g, '&#039;')
        return split_md_link(text);
    }
    function escape_html_characters(text) {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }
    function md_parse_lines(text) {
        return text.split('\n').map(line => {
            line = line.trimEnd();
            if (line.match(/^---+$/)) return '<hr/>';
            else if (line.startsWith('# ')) return '<h1>' + md_parse_sentence(line.substring(2)) + '</h1>';
            else if (line.startsWith('## ')) return '<h2>' + md_parse_sentence(line.substring(3)) + '</h2>';
            else if (line.startsWith('### ')) return '<h3>' + md_parse_sentence(line.substring(4)) + '</h3>';
            else if (line.startsWith('#### ')) return '<h4>' + md_parse_sentence(line.substring(5)) + '</h4>';
            else if (line.startsWith('##### ')) return '<h5>' + md_parse_sentence(line.substring(6)) + '</h5>';
            else if (line.startsWith('###### ')) return '<h6>' + md_parse_sentence(line.substring(7)) + '</h6>';
            else if (line.startsWith('* ')) return '<ul><li>' + md_parse_sentence(line.substring(2)) + '</li></ul>';
            else if (line.startsWith('  * ')) return '<ul><ul><li>' + md_parse_sentence(line.substring(4)) + '</li></ul></ul>';
            else if (line.endsWith('\\')) return md_parse_sentence(line.substring(0, line.length - 1)) + '<br/>';
            else return md_parse_sentence(line);
        }).join('\n').replaceAll('</ul>\n<ul>', '\n').replaceAll('</ul>\n<ul>', '\n');
    }
    function md_parse_tables(text) {
        text = split_nyn(text.trim(), /\|(?: *:?-+:? *\|)+\n/g);
        text = text.slice(0, 2).concat([text.slice(2).join('')]);
        console.assert(text.length === 3);
        function md_convert_separator(text) {
            console.assert(text.startsWith('|') && text.endsWith('|'));
            return text.slice(1, -1).split('|').map(v => v.trim()).map(v => {
                if (v.startsWith(':') && v.endsWith(':')) return ' style="text-align: center;"';
                else if (v.startsWith(':')) return ' style="text-align: left;"';
                else if (v.endsWith(':')) return ' style="text-align: right;"';
                else return '';
            });
        }
        function md_parse_table_headers(text, separator) {
            console.assert(text.startsWith('|') && text.endsWith('|'));
            text = text.slice(1, -1).split('|');
            for (let i = 0; i < text.length; i++) {
                text[i] = '   <th' + (i < separator.length ? separator[i] : '') + '>\n' + md_parse_lines(text[i]) + '\n   </th>\n';
            }
            return '  <tr>\n' + text.join('') + '  </tr>';
        }
        function md_parse_table_row(text, separator) {
            console.assert(text.startsWith('|') && text.endsWith('|'));
            text = text.slice(1, -1).split('|');
            for (let i = 0; i < text.length; i++) {
                text[i] = '   <td' + (i < separator.length ? separator[i] : '') + '>\n' + md_parse_lines(text[i]) + '\n   </td>\n';
            }
            return text.join('');
        }
        function md_parse_table_contents(text, separator) {
            text = text.split('\n');
            for (let i = 0; i < text.length; i++) {
                text[i] = md_parse_table_row(text[i], separator);
            }
            return '  <tr>\n' + text.join('  </tr>\n  <tr>\n') + '\n  </tr>';
        }
        let header = text[0].trim();
        let separator = md_convert_separator(text[1].trim());
        let content = text[2].trim();
        return '<table style="border-collapse: collapse;" border=1px cellpadding=10%>\n <thead>\n'
            + md_parse_table_headers(header, separator)
            + '\n </thead>\n <tbody>\n'
            + md_parse_table_contents(content, separator)
            + '\n </tbody>\n</table>';
    }
    function split_md_tables(text) {
        text = split_nyn(text, /(?:^|\n)\|(?:[^|]+\|)+\n\|(?: *:?-+:? *\|)+\n(?:\|(?:[^|]+\|)+(?:$|\n))+/g);
        // console.log('split_md_tables('+text.length+'):'+text);
        for (let i = 1; i < text.length; i += 2) {
            text[i] = md_parse_tables(text[i]);
        }
        for (let i = 0; i < text.length; i += 2) {
            text[i] = md_parse_lines(text[i]);
        }
        return text.join('');
    }
    function md_parse_paragraph(text) {
        return split_md_tables(text);
    }
    function md_split_paragraph(text) {
        text = text.split(/\n\n+/g).map(p => md_parse_paragraph(p));
        return '<p>' + text.join('</p>\n<p>') + '</p>';
    }
    function md_decorate_codeblock(text) {
        return '<pre tabindex="-1" style="color: #202124; font-style: inherit; letter-spacing: .0142857143em; font-weight: 400; font-size: .8125rem; word-break: break-word; overflow-wrap: break-word; background-color: #f8f9fa; border-radius: 2px; font-family: WorkAroundWebKitAndMozilla,monospace; border: 1px solid; overflow-x: auto; padding: 8px 16px; line-height: 1.5;">'
            + '<code style="padding: 0; white-space: pre;">'
            + escape_html_characters(text)
            + '</code></pre>';
    }
    function split_alternative_md_codeblocks(text) {
        text = text.split('\n');
        let stk = [];
        let ept = [];
        let result = [];
        let is_code = !!text[0].trimEnd().match('^    [^ ]');
        for (let i = 0; i < text.length; i++) {
            if (text[i].trimEnd() === '') {
                ept.push(text[i]);
            } else if (text[i].trimEnd().startsWith('    ')) {
                stk = stk.concat(ept);
                ept = [];
                if (!is_code) {
                    result.push(md_split_paragraph(stk.join('\n')));
                    stk = [];
                    is_code = true;
                }
                stk.push(text[i].substring(4));
            } else {
                if (is_code) {
                    result.push(md_decorate_codeblock(stk.join('\n')));
                    stk = [];
                    is_code = false;
                }
                stk = stk.concat(ept);
                ept = [];
                stk.push(text[i]);
            }
        }
        result.push(is_code ? md_decorate_codeblock(stk.concat(ept).join('\n')) : md_split_paragraph(stk.concat(ept).join('\n')));
        return result.join('\n');
    }
    function md_parse_codeblocks(text) {
        text = text.trim();
        console.assert(text.startsWith('```') && text.endsWith('\n```'));
        text = text.split('\n');
        text = text.slice(1, -1).join('\n');
        return md_decorate_codeblock(text);
    }
    function split_md_codeblocks(text) {
        text = split_nyn(text, /(?:^|\n)```[a-z]*\n(?:(?!```).)*\n```(?:$|\n)/sg);
        // console.log('split_md_codeblocks('+text.length+'):'+text);
        for (let i = 1; i < text.length; i += 2) {
            text[i] = md_parse_codeblocks(text[i]);
        }
        for (let i = 0; i < text.length; i += 2) {
            text[i] = split_alternative_md_codeblocks(text[i]);
        }
        return text.join('');
    }
    function split_javascripts(text) {
        text = split_nyn(text, /<script(?:(?:)|(?: [^>]+))>(?:(?!<\/script>).)*<\/script>/sg);
        // console.log('split_javascripts('+text.length+'):'+text);
        for (let i = 0; i < text.length; i += 2) {
            text[i] = split_md_codeblocks(text[i]);
        }
        return text.join('');
    }
    return split_javascripts(text);
}
Array.from(document.getElementsByClassName('markdown-content')).map(e => { e.innerHTML = md_parse(e.innerHTML); });