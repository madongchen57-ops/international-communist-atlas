/* Native SVG pointers remain visible over modal dialogs. */
(function () {
    'use strict';
    if (window.__qmlmCursorReady) return;
    window.__qmlmCursorReady = true;
    var base = new URL('../', document.currentScript.src), key = 'icm-atlas:cursor:v1', selected = 'hammer';
    try { var saved = localStorage.getItem(key); if (['hammer', 'star', 'system'].includes(saved)) selected = saved; } catch (_) {}
    var style = document.createElement('style'); style.id = 'qmlm-cursor-style';
    style.textContent = '@media (hover:hover) and (pointer:fine){' + ['hammer','star'].map(function (name) {
        return 'html[data-qmlm-cursor="' + name + '"],html[data-qmlm-cursor="' + name + '"] body,html[data-qmlm-cursor="' + name + '"] body *{cursor:url("' + new URL('images/icons/cursor/' + name + '.svg?v=2',base).href + '") '+(name==='hammer'?'6 30':'18 2')+',auto!important}';
    }).join('') + '} .cursor-setting{display:inline-flex;align-items:center;gap:5px;font-size:12px;margin:5px}.cursor-setting select{font:inherit;padding:5px;border:1px solid currentColor;border-radius:5px;background:transparent;color:inherit;max-width:100px}.cursor-setting option{color:#302832;background:#fffaf3}';
    document.head.append(style);
    function apply(value) {
        selected = value; document.documentElement.dataset.qmlmCursor = value;
        document.querySelectorAll('[data-qmlm-cursor-select]').forEach(function (select) { select.value = value; });
        if (value !== 'system') {
            var probe = new Image(); probe.onerror = function () { if (selected === value) { selected = 'system'; document.documentElement.dataset.qmlmCursor = 'system'; document.querySelectorAll('[data-qmlm-cursor-select]').forEach(function (s) { s.value = 'system'; s.title = '光标资源未加载，已使用系统光标'; }); } };
            probe.src = new URL('images/icons/cursor/' + value + '.svg', base).href;
        }
    }
    function boot() {
        if (!document.querySelector('[data-qmlm-cursor-select]')) {
            var label = document.createElement('label'); label.className = 'cursor-setting'; label.textContent = '鼠标';
            var select = document.createElement('select'); select.setAttribute('aria-label','鼠标样式'); select.dataset.qmlmCursorSelect = '';
            [['hammer','金色锤镰'],['star','红色五星'],['system','系统光标']].forEach(function (item) { var option = document.createElement('option'); option.value = item[0]; option.textContent = item[1]; select.append(option); });
            select.addEventListener('change', function () { apply(select.value); try { localStorage.setItem(key, selected); select.title = ''; } catch (_) { select.title = '未持久保存：当前会话仍可使用'; } });
            label.append(select); (document.querySelector('.main-nav') || document.body).append(label);
        }
        apply(selected);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
