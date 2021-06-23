
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var allDogs = [];
    var allFilters =  [{name: "Toy", applied: false }, {name: "Working", applied: false}, {name:"Terrier", applied: false}, {name:"Mixed", applied: false}, {name: "Herding", applied: false}, {name: "Non-Sporting", applied: false}, {name:"Hound", applied: false}];



    const loading = writable(true);
    const dogs = writable(allDogs);
    const filters = writable(allFilters);
    const favoriteCount = writable(0);


    filters.subscribe(newFilters => {
        var selectedBreeds = [];
        newFilters.forEach(filter => {
            if(filter.applied == true){
                selectedBreeds.push(filter.name);
            }
        });
        var oldDogs = get_store_value(dogs);
        oldDogs.map(dog => dog.isFiltered = selectedBreeds.includes(dog.breed_group));
        dogs.set(oldDogs);
      });

    fetch('https://api.thedogapi.com/v1/breeds')
    .then((response) => response.json())
    .then((data) => {
        allDogs = data;
        dogs.set(extendDogObject(data));
        loading.set(false);
    });

    const extendDogObject = function(previousDogs){
        var newList = [];
        previousDogs.forEach(element => {
            var extendedElement = element;
            extendedElement["isFavorite"] = false;
            extendedElement["isFiltered"] = false;
            newList.push(extendedElement);
            }
        );
        return newList

    };

    /* src/components/DogCard.svelte generated by Svelte v3.38.3 */

    const { console: console_1$2 } = globals;
    const file$6 = "src/components/DogCard.svelte";

    // (64:2) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let h40;
    	let t0;
    	let t1_value = (/*dog*/ ctx[0].bred_for || "None") + "";
    	let t1;
    	let t2;
    	let h41;
    	let t3;
    	let t4_value = (/*dog*/ ctx[0].breed_group || "None") + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h40 = element("h4");
    			t0 = text("Breed: ");
    			t1 = text(t1_value);
    			t2 = space();
    			h41 = element("h4");
    			t3 = text("Group: ");
    			t4 = text(t4_value);
    			add_location(h40, file$6, 65, 6, 1764);
    			add_location(h41, file$6, 66, 6, 1811);
    			attr_dev(div, "class", "svelte-1gar2bx");
    			add_location(div, file$6, 64, 4, 1752);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h40);
    			append_dev(h40, t0);
    			append_dev(h40, t1);
    			append_dev(div, t2);
    			append_dev(div, h41);
    			append_dev(h41, t3);
    			append_dev(h41, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dog*/ 1 && t1_value !== (t1_value = (/*dog*/ ctx[0].bred_for || "None") + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*dog*/ 1 && t4_value !== (t4_value = (/*dog*/ ctx[0].breed_group || "None") + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(64:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:2) {#if extra}
    function create_if_block_1$3(ctx) {
    	let div;
    	let h40;
    	let t0;
    	let t1_value = (/*dog*/ ctx[0].bred_for || "None") + "";
    	let t1;
    	let t2;
    	let h41;
    	let t3;
    	let t4_value = (/*dog*/ ctx[0].breed_group || "None") + "";
    	let t4;
    	let t5;
    	let p;
    	let t6;
    	let p_id_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h40 = element("h4");
    			t0 = text("Breed: ");
    			t1 = text(t1_value);
    			t2 = space();
    			h41 = element("h4");
    			t3 = text("Group: ");
    			t4 = text(t4_value);
    			t5 = space();
    			p = element("p");
    			t6 = text("-");
    			add_location(h40, file$6, 59, 6, 1609);
    			add_location(h41, file$6, 60, 6, 1656);
    			attr_dev(p, "id", p_id_value = /*dog*/ ctx[0].id);
    			add_location(p, file$6, 61, 6, 1706);
    			attr_dev(div, "class", "svelte-1gar2bx");
    			add_location(div, file$6, 58, 4, 1597);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h40);
    			append_dev(h40, t0);
    			append_dev(h40, t1);
    			append_dev(div, t2);
    			append_dev(div, h41);
    			append_dev(h41, t3);
    			append_dev(h41, t4);
    			append_dev(div, t5);
    			append_dev(div, p);
    			append_dev(p, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dog*/ 1 && t1_value !== (t1_value = (/*dog*/ ctx[0].bred_for || "None") + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*dog*/ 1 && t4_value !== (t4_value = (/*dog*/ ctx[0].breed_group || "None") + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*dog*/ 1 && p_id_value !== (p_id_value = /*dog*/ ctx[0].id)) {
    				attr_dev(p, "id", p_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(58:2) {#if extra}",
    		ctx
    	});

    	return block;
    }

    // (74:2) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Add to Favorites");
    			button.disabled = /*favorite*/ ctx[1];
    			attr_dev(button, "onclick", "this.disabled=true");
    			add_location(button, file$6, 74, 4, 2081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*addToFavorites*/ ctx[6](/*dog*/ ctx[0]))) /*addToFavorites*/ ctx[6](/*dog*/ ctx[0]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*favorite*/ 2) {
    				prop_dev(button, "disabled", /*favorite*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(74:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (71:2) {#if extra}
    function create_if_block$4(ctx) {
    	let button0;
    	let t0;
    	let button0_id_value;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			t0 = text("See More");
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Delete from Favorites";
    			attr_dev(button0, "id", button0_id_value = "seeMore-button" + /*dog*/ ctx[0].id);
    			add_location(button0, file$6, 71, 4, 1911);
    			add_location(button1, file$6, 72, 4, 1992);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*moreInfo*/ ctx[4], false, false, false),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*removeFromFavorites*/ ctx[5](/*dog*/ ctx[0]))) /*removeFromFavorites*/ ctx[5](/*dog*/ ctx[0]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*dog*/ 1 && button0_id_value !== (button0_id_value = "seeMore-button" + /*dog*/ ctx[0].id)) {
    				attr_dev(button0, "id", button0_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(71:2) {#if extra}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let img;
    	let img_src_value;
    	let t0;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*extra*/ ctx[2]) return create_if_block_1$3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*extra*/ ctx[2]) return create_if_block$4;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			img = element("img");
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			if_block1.c();
    			attr_dev(img, "id", "image");
    			attr_dev(img, "alt", "dog");
    			if (img.src !== (img_src_value = /*dog*/ ctx[0].image.url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1gar2bx");
    			add_location(img, file$6, 55, 2, 1514);
    			set_style(main, "background-color", /*bg*/ ctx[3]);
    			attr_dev(main, "class", "svelte-1gar2bx");
    			add_location(main, file$6, 54, 0, 1473);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, img);
    			append_dev(main, t0);
    			if_block0.m(main, null);
    			append_dev(main, t1);
    			if_block1.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*dog*/ 1 && img.src !== (img_src_value = /*dog*/ ctx[0].image.url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(main, t1);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(main, null);
    				}
    			}

    			if (dirty & /*bg*/ 8) {
    				set_style(main, "background-color", /*bg*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DogCard", slots, []);
    	let { dog } = $$props;
    	let { favorite } = $$props;
    	let { extra } = $$props;
    	let { bg } = $$props;

    	const moreInfo = () => {
    		console.log("see more button clicked");
    		var id = "seeMore-button" + dog.id;
    		var life = dog.life_span || "None";
    		var origin = dog.origin || "None";
    		var temperament = dog.temperament || "None";

    		if (document.getElementById(dog.id).innerHTML == "-") {
    			console.log("Lo encontro");
    			document.getElementById(dog.id).innerHTML = "Life Span: " + life + ";\n Origin: " + origin + ";\n Temperament: " + temperament;
    			document.getElementById(id).innerHTML = "See Less";
    		} else {
    			document.getElementById(dog.id).innerHTML = "-";
    			document.getElementById(id).innerHTML = "See More";
    		}
    	};

    	const removeFromFavorites = dog => {
    		var oldCount = get_store_value(favoriteCount);
    		favoriteCount.set(oldCount - 1);
    		var newDogs = get_store_value(dogs);

    		newDogs.map(option => {
    			if (option.id === dog.id) {
    				option.isFavorite = false;
    			}
    		});

    		dogs.set(newDogs);
    	};

    	const addToFavorites = dog => {
    		var oldCount = get_store_value(favoriteCount);
    		favoriteCount.set(oldCount + 1);
    		var newDogs = get_store_value(dogs);

    		newDogs.map(option => {
    			if (option.id === dog.id) {
    				option.isFavorite = true;
    			}
    		});

    		dogs.set(newDogs);
    	};

    	const writable_props = ["dog", "favorite", "extra", "bg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<DogCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("dog" in $$props) $$invalidate(0, dog = $$props.dog);
    		if ("favorite" in $$props) $$invalidate(1, favorite = $$props.favorite);
    		if ("extra" in $$props) $$invalidate(2, extra = $$props.extra);
    		if ("bg" in $$props) $$invalidate(3, bg = $$props.bg);
    	};

    	$$self.$capture_state = () => ({
    		get: get_store_value,
    		dogs,
    		favoriteCount,
    		dog,
    		favorite,
    		extra,
    		bg,
    		moreInfo,
    		removeFromFavorites,
    		addToFavorites
    	});

    	$$self.$inject_state = $$props => {
    		if ("dog" in $$props) $$invalidate(0, dog = $$props.dog);
    		if ("favorite" in $$props) $$invalidate(1, favorite = $$props.favorite);
    		if ("extra" in $$props) $$invalidate(2, extra = $$props.extra);
    		if ("bg" in $$props) $$invalidate(3, bg = $$props.bg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [dog, favorite, extra, bg, moreInfo, removeFromFavorites, addToFavorites];
    }

    class DogCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { dog: 0, favorite: 1, extra: 2, bg: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DogCard",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dog*/ ctx[0] === undefined && !("dog" in props)) {
    			console_1$2.warn("<DogCard> was created without expected prop 'dog'");
    		}

    		if (/*favorite*/ ctx[1] === undefined && !("favorite" in props)) {
    			console_1$2.warn("<DogCard> was created without expected prop 'favorite'");
    		}

    		if (/*extra*/ ctx[2] === undefined && !("extra" in props)) {
    			console_1$2.warn("<DogCard> was created without expected prop 'extra'");
    		}

    		if (/*bg*/ ctx[3] === undefined && !("bg" in props)) {
    			console_1$2.warn("<DogCard> was created without expected prop 'bg'");
    		}
    	}

    	get dog() {
    		throw new Error("<DogCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dog(value) {
    		throw new Error("<DogCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get favorite() {
    		throw new Error("<DogCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set favorite(value) {
    		throw new Error("<DogCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get extra() {
    		throw new Error("<DogCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set extra(value) {
    		throw new Error("<DogCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bg() {
    		throw new Error("<DogCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bg(value) {
    		throw new Error("<DogCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Dogs.svelte generated by Svelte v3.38.3 */
    const file$5 = "src/components/Dogs.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (11:33) 
    function create_if_block_1$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$dogs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$dogs*/ 2) {
    				each_value = /*$dogs*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(11:33) ",
    		ctx
    	});

    	return block;
    }

    // (9:4) {#if $loading === true}
    function create_if_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading Dogs...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(9:4) {#if $loading === true}",
    		ctx
    	});

    	return block;
    }

    // (12:6) {#each $dogs as dog}
    function create_each_block$4(ctx) {
    	let dogcard;
    	let current;

    	dogcard = new DogCard({
    			props: {
    				extra: false,
    				favorite: /*dog*/ ctx[2].isFavorite,
    				dog: /*dog*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dogcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dogcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dogcard_changes = {};
    			if (dirty & /*$dogs*/ 2) dogcard_changes.favorite = /*dog*/ ctx[2].isFavorite;
    			if (dirty & /*$dogs*/ 2) dogcard_changes.dog = /*dog*/ ctx[2];
    			dogcard.$set(dogcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dogcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dogcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dogcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(12:6) {#each $dogs as dog}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_if_block_1$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$loading*/ ctx[0] === true) return 0;
    		if (/*$dogs*/ ctx[1] != undefined) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Dogs List";
    			t1 = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			add_location(h1, file$5, 6, 2, 118);
    			attr_dev(div, "class", "svelte-1put6l5");
    			add_location(div, file$5, 7, 2, 139);
    			add_location(main, file$5, 5, 0, 109);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $loading;
    	let $dogs;
    	validate_store(loading, "loading");
    	component_subscribe($$self, loading, $$value => $$invalidate(0, $loading = $$value));
    	validate_store(dogs, "dogs");
    	component_subscribe($$self, dogs, $$value => $$invalidate(1, $dogs = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Dogs", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dogs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ DogCard, loading, dogs, $loading, $dogs });
    	return [$loading, $dogs];
    }

    class Dogs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dogs",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Filters.svelte generated by Svelte v3.38.3 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/components/Filters.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (19:2) {#each $filters as filter}
    function create_each_block$3(ctx) {
    	let div;
    	let t0_value = /*filter*/ ctx[2].name + "";
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let button_disabled_value;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			t2 = text("Add Filter");
    			t3 = space();
    			button.disabled = button_disabled_value = /*filter*/ ctx[2].applied;
    			add_location(button, file$4, 21, 6, 537);
    			add_location(div, file$4, 19, 4, 505);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(button, t2);
    			append_dev(div, t3);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*addFilter*/ ctx[1](/*filter*/ ctx[2]))) /*addFilter*/ ctx[1](/*filter*/ ctx[2]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$filters*/ 1 && t0_value !== (t0_value = /*filter*/ ctx[2].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$filters*/ 1 && button_disabled_value !== (button_disabled_value = /*filter*/ ctx[2].applied)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(19:2) {#each $filters as filter}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let each_value = /*$filters*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Breed Group Filters";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$4, 17, 2, 443);
    			add_location(main, file$4, 16, 0, 434);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$filters, addFilter*/ 3) {
    				each_value = /*$filters*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $filters;
    	validate_store(filters, "filters");
    	component_subscribe($$self, filters, $$value => $$invalidate(0, $filters = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Filters", slots, []);

    	const addFilter = filter => {
    		console.log("add filter from button");
    		let filtersObjects = get_store_value(filters);

    		filtersObjects.map(filterObject => {
    			if (filterObject.name === filter.name) {
    				filterObject.applied = true;
    			}
    		});

    		filters.set(filtersObjects);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Filters> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ each, get: get_store_value, filters, addFilter, $filters });
    	return [$filters, addFilter];
    }

    class Filters extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Filters",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Applied.svelte generated by Svelte v3.38.3 */

    const { console: console_1 } = globals;
    const file$3 = "src/components/Applied.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (30:4) {#if filter.applied === true}
    function create_if_block$2(ctx) {
    	let div;
    	let t0_value = /*filter*/ ctx[3].name + "";
    	let t0;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			button.textContent = "Delete";
    			add_location(button, file$3, 32, 8, 822);
    			add_location(div, file$3, 30, 6, 786);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*deleteFilter*/ ctx[1](/*filter*/ ctx[3]))) /*deleteFilter*/ ctx[1](/*filter*/ ctx[3]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$filters*/ 1 && t0_value !== (t0_value = /*filter*/ ctx[3].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(30:4) {#if filter.applied === true}",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#each $filters as filter}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*filter*/ ctx[3].applied === true && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*filter*/ ctx[3].applied === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(29:2) {#each $filters as filter}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*$filters*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Applied Filters";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "Clear All";
    			add_location(h1, file$3, 27, 2, 692);
    			add_location(button, file$3, 36, 2, 913);
    			add_location(main, file$3, 26, 0, 683);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			append_dev(main, t2);
    			append_dev(main, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*clearFilters*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*deleteFilter, $filters*/ 3) {
    				each_value = /*$filters*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $filters;
    	validate_store(filters, "filters");
    	component_subscribe($$self, filters, $$value => $$invalidate(0, $filters = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Applied", slots, []);

    	const deleteFilter = filter => {
    		console.log("delete filter from button");
    		let filtersObjects = get_store_value(filters);

    		filtersObjects.map(filterObject => {
    			if (filterObject.name === filter.name) {
    				filterObject.applied = false;
    			}
    		});

    		filters.set(filtersObjects);
    	};

    	const clearFilters = () => {
    		console.log("clear filters from button");
    		let filtersObjects = get_store_value(filters);

    		filtersObjects.map(filterObject => {
    			filterObject.applied = false;
    		});

    		filters.set(filtersObjects);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Applied> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		each,
    		filters,
    		get: get_store_value,
    		deleteFilter,
    		clearFilters,
    		$filters
    	});

    	return [$filters, deleteFilter, clearFilters];
    }

    class Applied extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Applied",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/FilteredDogs.svelte generated by Svelte v3.38.3 */
    const file$2 = "src/components/FilteredDogs.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (8:2) {#if $dogs.length > 0}
    function create_if_block$1(ctx) {
    	let div;
    	let current;
    	let each_value = /*$dogs*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "svelte-1put6l5");
    			add_location(div, file$2, 8, 4, 161);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$dogs*/ 1) {
    				each_value = /*$dogs*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(8:2) {#if $dogs.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (11:8) {#if dog.isFiltered == true}
    function create_if_block_1$1(ctx) {
    	let dogcard;
    	let current;

    	dogcard = new DogCard({
    			props: {
    				extra: false,
    				favorite: /*dog*/ ctx[1].isFavorite,
    				dog: /*dog*/ ctx[1],
    				bg: "yellow"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dogcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dogcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dogcard_changes = {};
    			if (dirty & /*$dogs*/ 1) dogcard_changes.favorite = /*dog*/ ctx[1].isFavorite;
    			if (dirty & /*$dogs*/ 1) dogcard_changes.dog = /*dog*/ ctx[1];
    			dogcard.$set(dogcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dogcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dogcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dogcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(11:8) {#if dog.isFiltered == true}",
    		ctx
    	});

    	return block;
    }

    // (10:6) {#each $dogs as dog}
    function create_each_block$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*dog*/ ctx[1].isFiltered == true && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*dog*/ ctx[1].isFiltered == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$dogs*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(10:6) {#each $dogs as dog}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let current;
    	let if_block = /*$dogs*/ ctx[0].length > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Filtered Dogs";
    			t1 = space();
    			if (if_block) if_block.c();
    			add_location(h1, file$2, 6, 2, 109);
    			add_location(main, file$2, 5, 0, 100);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$dogs*/ ctx[0].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$dogs*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $dogs;
    	validate_store(dogs, "dogs");
    	component_subscribe($$self, dogs, $$value => $$invalidate(0, $dogs = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FilteredDogs", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FilteredDogs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ DogCard, dogs, $dogs });
    	return [$dogs];
    }

    class FilteredDogs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FilteredDogs",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/FavoriteDogs.svelte generated by Svelte v3.38.3 */
    const file$1 = "src/components/FavoriteDogs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (9:4) {#if $favoriteCount != 0}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$dogs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$dogs*/ 2) {
    				each_value = /*$dogs*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(9:4) {#if $favoriteCount != 0}",
    		ctx
    	});

    	return block;
    }

    // (11:8) {#if dog.isFavorite == true}
    function create_if_block_1(ctx) {
    	let dogcard;
    	let current;

    	dogcard = new DogCard({
    			props: {
    				extra: true,
    				favorite: /*dog*/ ctx[2].isFavorite,
    				dog: /*dog*/ ctx[2],
    				bg: "lightpink"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dogcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dogcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dogcard_changes = {};
    			if (dirty & /*$dogs*/ 2) dogcard_changes.favorite = /*dog*/ ctx[2].isFavorite;
    			if (dirty & /*$dogs*/ 2) dogcard_changes.dog = /*dog*/ ctx[2];
    			dogcard.$set(dogcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dogcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dogcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dogcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(11:8) {#if dog.isFavorite == true}",
    		ctx
    	});

    	return block;
    }

    // (10:6) {#each $dogs as dog}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*dog*/ ctx[2].isFavorite == true && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*dog*/ ctx[2].isFavorite == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$dogs*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(10:6) {#each $dogs as dog}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div;
    	let current;
    	let if_block = /*$favoriteCount*/ ctx[0] != 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Favorite Dogs List (");
    			t1 = text(/*$favoriteCount*/ ctx[0]);
    			t2 = text(")");
    			t3 = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			add_location(h1, file$1, 6, 2, 124);
    			attr_dev(div, "class", "svelte-1put6l5");
    			add_location(div, file$1, 7, 2, 173);
    			add_location(main, file$1, 5, 0, 115);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			append_dev(main, div);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$favoriteCount*/ 1) set_data_dev(t1, /*$favoriteCount*/ ctx[0]);

    			if (/*$favoriteCount*/ ctx[0] != 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$favoriteCount*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $favoriteCount;
    	let $dogs;
    	validate_store(favoriteCount, "favoriteCount");
    	component_subscribe($$self, favoriteCount, $$value => $$invalidate(0, $favoriteCount = $$value));
    	validate_store(dogs, "dogs");
    	component_subscribe($$self, dogs, $$value => $$invalidate(1, $dogs = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FavoriteDogs", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FavoriteDogs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		DogCard,
    		favoriteCount,
    		dogs,
    		$favoriteCount,
    		$dogs
    	});

    	return [$favoriteCount, $dogs];
    }

    class FavoriteDogs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FavoriteDogs",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/App.svelte generated by Svelte v3.38.3 */
    const file = "src/components/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let dogs;
    	let t2;
    	let hr0;
    	let t3;
    	let filters;
    	let t4;
    	let hr1;
    	let t5;
    	let applied;
    	let t6;
    	let hr2;
    	let t7;
    	let filtereddogs;
    	let t8;
    	let hr3;
    	let t9;
    	let favoritedogs;
    	let current;
    	dogs = new Dogs({ $$inline: true });
    	filters = new Filters({ $$inline: true });
    	applied = new Applied({ $$inline: true });
    	filtereddogs = new FilteredDogs({ $$inline: true });
    	favoritedogs = new FavoriteDogs({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "DOG ENCYCLOPEDIA";
    			t1 = space();
    			create_component(dogs.$$.fragment);
    			t2 = space();
    			hr0 = element("hr");
    			t3 = space();
    			create_component(filters.$$.fragment);
    			t4 = space();
    			hr1 = element("hr");
    			t5 = space();
    			create_component(applied.$$.fragment);
    			t6 = space();
    			hr2 = element("hr");
    			t7 = space();
    			create_component(filtereddogs.$$.fragment);
    			t8 = space();
    			hr3 = element("hr");
    			t9 = space();
    			create_component(favoritedogs.$$.fragment);
    			attr_dev(h1, "class", "svelte-1e9puaw");
    			add_location(h1, file, 9, 2, 253);
    			add_location(hr0, file, 11, 2, 292);
    			add_location(hr1, file, 13, 2, 315);
    			add_location(hr2, file, 15, 2, 338);
    			add_location(hr3, file, 17, 2, 366);
    			attr_dev(main, "class", "svelte-1e9puaw");
    			add_location(main, file, 8, 0, 244);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(dogs, main, null);
    			append_dev(main, t2);
    			append_dev(main, hr0);
    			append_dev(main, t3);
    			mount_component(filters, main, null);
    			append_dev(main, t4);
    			append_dev(main, hr1);
    			append_dev(main, t5);
    			mount_component(applied, main, null);
    			append_dev(main, t6);
    			append_dev(main, hr2);
    			append_dev(main, t7);
    			mount_component(filtereddogs, main, null);
    			append_dev(main, t8);
    			append_dev(main, hr3);
    			append_dev(main, t9);
    			mount_component(favoritedogs, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dogs.$$.fragment, local);
    			transition_in(filters.$$.fragment, local);
    			transition_in(applied.$$.fragment, local);
    			transition_in(filtereddogs.$$.fragment, local);
    			transition_in(favoritedogs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dogs.$$.fragment, local);
    			transition_out(filters.$$.fragment, local);
    			transition_out(applied.$$.fragment, local);
    			transition_out(filtereddogs.$$.fragment, local);
    			transition_out(favoritedogs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(dogs);
    			destroy_component(filters);
    			destroy_component(applied);
    			destroy_component(filtereddogs);
    			destroy_component(favoritedogs);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Dogs,
    		Filters,
    		Applied,
    		FilteredDogs,
    		FavoriteDogs
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
