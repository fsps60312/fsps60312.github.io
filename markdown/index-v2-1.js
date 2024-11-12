function md_parse(text) {
    let result = [];
    let states = [{ mode: 'markdown', buffer: [] }];
    function buffer() {
        return states[states.length - 1].buffer;
    }
    function mode() {
        return states[states.length - 1].mode;
    }
    function push_mode(new_mode) {
        states.push({ mode: new_mode, buffer: [] });
    }
    function switch_mode(new_mode) {
        states[states.length - 1].mode = new_mode;
    }
    function roll_back() {
        console.assert(states.length >= 2);
        let s = states.pop();
        states[states.length - 1].buffer = buffer().concat(s.buffer);
    }
    function pop_to_result(c) {
        result.push(buffer().join() + c);
        states.pop();
    }
    for (let c of text) {
        function accept_token(c) {
            function html_tag_start() {

            }
            function markdown() {
                if (c == '<') {
                    html_tag_start();
                    return;
                }
            }
            while (true) {
                switch (mode()) {
                    case 'markdown':
                        if (c == '<') {
                            push_mode('html tag start');
                            buffer().push(c);
                            return;
                        }
                    case 'html: tag start':
                        if (c == '/') {
                            switch_mode('html: end tag');
                            buffer().push(c);
                            return;
                        } else if (c.match(/[a-zA-Z]/)) {
                            switch_mode('html: start tag: name');
                            buffer().push(c);
                            return;
                        }
                    case 'html: end tag':
                        if (c.match(/[a-zA-Z]/)) {
                            switch_mode('html end tag: name');
                            buffer().push(c);
                            return;
                        } else {
                            roll_back();
                            break;
                        }
                    case 'html: start tag: name':
                        if (c.match(/[a-zA-Z]/)) {
                            buffer().push(c);
                            return;
                        } else if (c == ' ') {
                            switch_mode('html: start tag: name end');
                            buffer().push(c);
                            return;
                        } else {
                            roll_back();
                            break;
                        }
                    case 'html: start tag: name end':
                        // todo
                        buffer().push(c);
                        return;
                    case 'html: end tag: name':
                        if (c.match(/[a-zA-Z]/)) {
                            buffer().push(c);
                            return;
                        } else if (c == ' ') {
                            switch_mode('html: end tag: name end');
                            buffer().push(c);
                            return;
                        } else {
                            roll_back();
                            break;
                        }
                    case 'html: end tag: name end':
                        if (c == ' ') {
                            buffer().push(c);
                            return;
                        } else if (c == '/') {
                            switch_mode('html: end tag: end');
                            buffer().push(c);
                            return;
                        } else {
                            roll_back();
                            break;
                        }
                    case 'html: end tag: end':
                        if (c == '>') {
                            pop_to_result(c);
                            return;
                        } else {
                            roll_back();
                            break;
                        }
                    default:
                        console.log('mode:' + mode);
                        return;
                }
            }
        }
        accept_token(c);
    }
    while (states.length >= 2) roll_back();
    return result.concat(buffer()).join('');
}
Array.from(document.getElementsByClassName('markdown-content')).map(e => { e.innerHTML = md_parse(e.innerHTML); });