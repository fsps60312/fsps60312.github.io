function md_parse(text) {
    function substr(s, i, j) {
        if (j <= 0) j = s.length + j;
        return s.substring(i, j);
    }

    let states = [{ buffer: [] }, { mode: '\n', buffer: [] }];
    function mode() {
        return states[states.length - 1].mode;
    }
    function set_mode(m) {
        states[states.length - 1].mode = m;
    }
    function push_buffer(c) {
        return states[states.length - 1].buffer.push(c);
    }
    function pull_buffer() {
        states[states.length - 1].buffer.pop(c);
    }
    function pop_buffer() {
        let s = states[states.length - 1].buffer.join('');
        states[states.length - 1].buffer = [];
        return s;
    }
    function push_result(s) {
        states[states.length - 2].buffer.push(s);
    }
    function push_state(m, n) {
        let new_s = { mode: m, buffer: states[states.length - 1].buffer.splice(-n, n) };
        states.push(new_s);
    }
    function pop_state() {
        states.pop();
    }
    for (let c of text) {
        function accept_token(c) {
            push_buffer(c);
            while (true) {
                switch (mode()) {
                    case '\n':
                        if (c === '\n') {
                            pop_buffer();
                            return;
                        } else {
                            set_mode('^');
                            break;
                        }
                    case '^':
                        if (c === '\n') {
                            push_result('<br/>\n');
                            pop_buffer();
                            set_mode('\n');
                            return;
                        } else if (c === '#') {
                            set_mode('^#');
                            return;
                        } else {
                            set_mode('^(.*)');
                            break;
                        }
                    case '^#':
                        if (c === ' ') {
                            pop_buffer();
                            set_mode('^# (.*)');
                            return;
                        } else if (c === '#') {
                            set_mode('^##');
                            return;
                        } else {
                            set_mode('^(.*)');
                            break;
                        }
                    case '^# (.*)':
                        if (c === '\n') {
                            push_result('<h1>' + pop_buffer() + '</h1>\n');
                            set_mode('^');
                            return;
                        } else {
                            return;
                        }
                    case '^##':
                        if (c === ' ') {
                            pop_buffer();
                            set_mode('^## (.*)');
                            return;
                        } else if (c === '#') {
                            set_mode('^###');
                            return;
                        } else {
                            set_mode('^(.*)');
                            break;
                        }
                    case '^## (.*)':
                        if (c === '\n') {
                            push_result('<h2>' + pop_buffer() + '</h2>\n');
                            set_mode('^');
                            return;
                        } else {
                            return;
                        }
                    case '^###':
                        if (c === ' ') {
                            pop_buffer();
                            set_mode('^### (.*)');
                            return;
                        } else {
                            set_mode('^(.*)');
                            break;
                        }
                    case '^### (.*)':
                        if (c === '\n') {
                            push_result('<h3>' + pop_buffer() + '</h3>\n');
                            set_mode('^');
                            return;
                        } else {
                            return;
                        }
                    case '^(.*)':
                        if (c === '\n') {
                            push_result(pop_buffer());
                            set_mode('^');
                            return;
                        } else if (c === '`') {
                            push_state('`.*', 1);
                            return;
                        } else {
                            return;
                        }
                    case '`.*':
                        if (c === '\n') {
                            push_result(pop_buffer());
                            pop_state();
                            break;
                        } else if (c === '`') {
                            set_mode('`.*`');
                            return;
                        } else {
                            return;
                        }
                    case '`.*`':
                        if (c !== '`') {
                            push_result('<span style="display: inline; color-scheme: light; visibility: inherit; line-height: 1.25rem; white-space: pre-wrap; word-break: break-word; word-wrap: break-word; font-feature-settings: liga 0; font-variant-ligatures: no-contextual; background: transparent; outline: 0; vertical-align: baseline; font-family: Roboto Mono,monospace; background-color: #fafafa; border: 1px solid; color: #424242; margin: 0 2px; padding: 1px 7px; font-size: .75rem;">' + substr(pop_buffer(), 1, -1) + '</span>');
                            pop_state();
                            break;
                        } else {
                            return;
                        }
                }
            }
        }
        accept_token(c);
    }
    return states[0].buffer.join('');
}
Array.from(document.getElementsByClassName('markdown-content')).map(e => { e.innerHTML = md_parse(e.innerHTML); });