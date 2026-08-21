/* ============================================================
 * Geometry
 * ============================================================ */
class Geometry {

    constructor({
        left = 0,
        top = 0,
        width = 0,
        height = 0
    } = {}) {
        this.left = left
        this.top = top
        this.width = width
        this.height = height
    }

    clone() {
        return new Geometry(this)
    }

    get right() {
        return this.left + this.width
    }

    get bottom() {
        return this.top + this.height
    }

    move(dx, dy) {
        return new Geometry({
            left: this.left + dx,
            top: this.top + dy,
            width: this.width,
            height: this.height
        })
    }

    resize(direction, dx, dy, minWidth, minHeight) {

        const right = this.right
        const bottom = this.bottom

        let left = this.left
        let top = this.top
        let width = this.width
        let height = this.height

        /* LEFT */

        if (direction.includes('l')) {
            left = Math.min(
                this.left + dx,
                right - minWidth
            )

            width = right - left
        }

        /* RIGHT */

        if (direction.includes('r')) {
            width = Math.max(
                minWidth,
                this.width + dx
            )
        }

        /* TOP */

        if (direction.includes('t')) {
            top = Math.min(
                this.top + dy,
                bottom - minHeight
            )

            height = bottom - top
        }

        /* BOTTOM */

        if (direction.includes('b')) {
            height = Math.max(
                minHeight,
                this.height + dy
            )
        }

        return new Geometry({
            left,
            top,
            width,
            height
        })
    }
}


/* ============================================================
 * ResponsiveGeometry
 *
 * Guarda geometria normalizada:
 *
 * x      = 0..1
 * y      = 0..1
 * width  = 0..1
 * height = 0..1
 * ============================================================ */
class ResponsiveGeometry {

    static normalize(
        geometry,
        containerWidth,
        containerHeight
    ) {

        if (
            containerWidth <= 0 ||
            containerHeight <= 0
        ) {
            return null
        }

        return {
            x: geometry.left / containerWidth,
            y: geometry.top / containerHeight,

            width:
                geometry.width /
                containerWidth,

            height:
                geometry.height /
                containerHeight
        }
    }

    static denormalize(
        normalized,
        containerWidth,
        containerHeight
    ) {

        return new Geometry({

            left:
                normalized.x *
                containerWidth,

            top:
                normalized.y *
                containerHeight,

            width:
                normalized.width *
                containerWidth,

            height:
                normalized.height *
                containerHeight
        })
    }
}


/* ============================================================
 * InteractionState
 * ============================================================ */
class InteractionState {

    constructor({
        element,
        pointerX,
        pointerY,
        geometry,
        type,
        direction = null
    }) {

        this.element = element

        this.pointerX = pointerX
        this.pointerY = pointerY

        this.initial = geometry.clone()

        this.type = type
        this.direction = direction
    }

    delta(event) {

        return {
            x: event.clientX - this.pointerX,
            y: event.clientY - this.pointerY
        }
    }
}


/* ============================================================
 * Constraints
 * ============================================================ */
class Constraints {

    constructor(container, options = {}) {

        this.container = container

        this.options = {
            includePadding: true,
            includeBorder: true,

            ...options
        }
    }

    get() {

        const rect =
            this.container.getBoundingClientRect()

        const css =
            getComputedStyle(this.container)

        const borderLeft =
            this.options.includeBorder
                ? parseFloat(css.borderLeftWidth) || 0
                : 0

        const borderRight =
            this.options.includeBorder
                ? parseFloat(css.borderRightWidth) || 0
                : 0

        const borderTop =
            this.options.includeBorder
                ? parseFloat(css.borderTopWidth) || 0
                : 0

        const borderBottom =
            this.options.includeBorder
                ? parseFloat(css.borderBottomWidth) || 0
                : 0

        const paddingLeft =
            this.options.includePadding
                ? parseFloat(css.paddingLeft) || 0
                : 0

        const paddingRight =
            this.options.includePadding
                ? parseFloat(css.paddingRight) || 0
                : 0

        const paddingTop =
            this.options.includePadding
                ? parseFloat(css.paddingTop) || 0
                : 0

        const paddingBottom =
            this.options.includePadding
                ? parseFloat(css.paddingBottom) || 0
                : 0

        const width =
            rect.width -
            borderLeft -
            borderRight

        const height =
            rect.height -
            borderTop -
            borderBottom

        return {

            left:
                borderLeft +
                paddingLeft,

            top:
                borderTop +
                paddingTop,

            right:
                width -
                paddingRight,

            bottom:
                height -
                paddingBottom,

            width,
            height
        }
    }


    clampPosition(geometry) {

        const limits = this.get()

        const maxLeft =
            Math.max(
                limits.left,
                limits.right - geometry.width
            )

        const maxTop =
            Math.max(
                limits.top,
                limits.bottom - geometry.height
            )

        return new Geometry({

            left: Math.max(
                limits.left,
                Math.min(
                    geometry.left,
                    maxLeft
                )
            ),

            top: Math.max(
                limits.top,
                Math.min(
                    geometry.top,
                    maxTop
                )
            ),

            width: geometry.width,
            height: geometry.height
        })
    }


    clampResize(
        geometry,
        initial,
        direction,
        minWidth,
        minHeight
    ) {

        const limits = this.get()

        let left = geometry.left
        let top = geometry.top
        let width = geometry.width
        let height = geometry.height

        /*
         * LEFT
         */

        if (direction.includes('l')) {

            const right =
                initial.right

            left = Math.max(
                limits.left,
                Math.min(
                    left,
                    right - minWidth
                )
            )

            width =
                right - left
        }

        /*
         * RIGHT
         */

        if (direction.includes('r')) {

            width = Math.max(
                minWidth,
                Math.min(
                    geometry.width,
                    limits.right - initial.left
                )
            )

            left =
                initial.left
        }

        /*
         * TOP
         */

        if (direction.includes('t')) {

            const bottom =
                initial.bottom

            top = Math.max(
                limits.top,
                Math.min(
                    top,
                    bottom - minHeight
                )
            )

            height =
                bottom - top
        }

        /*
         * BOTTOM
         */

        if (direction.includes('b')) {

            height = Math.max(
                minHeight,
                Math.min(
                    geometry.height,
                    limits.bottom - initial.top
                )
            )

            top =
                initial.top
        }

        return new Geometry({
            left,
            top,
            width,
            height
        })
    }
}


/* ============================================================
 * ContainerInteractive
 * ============================================================ */
class ContainerInteractive {

    constructor(container, options = {}) {

        this.container =
            this.resolveElement(container)

        this.options = options

        this.constraints =
            new Constraints(
                this.container,
                options
            )
    }


    resolveElement(element) {

        if (typeof element === 'string') {
            element =
                document.querySelector(element)
        }

        if (!(element instanceof Element)) {

            this.error(
                'elemento não encontrado.'
            )
        }

        return element
    }


    geometry(element) {

        const elementRect =
            element.getBoundingClientRect()

        const containerRect =
            this.container.getBoundingClientRect()

        const css =
            getComputedStyle(this.container)

        const borderLeft =
            parseFloat(
                css.borderLeftWidth
            ) || 0

        const borderTop =
            parseFloat(
                css.borderTopWidth
            ) || 0

        return new Geometry({

            left:
                elementRect.left -
                containerRect.left -
                borderLeft,

            top:
                elementRect.top -
                containerRect.top -
                borderTop,

            width:
                elementRect.width,

            height:
                elementRect.height
        })
    }


    applyGeometry(element, geometry) {

        element.style.left =
            `${geometry.left}px`

        element.style.top =
            `${geometry.top}px`

        element.style.width =
            `${geometry.width}px`

        element.style.height =
            `${geometry.height}px`
    }


    dispatch(element, type, detail = {}) {

        element.dispatchEvent(
            new CustomEvent(type, {
                bubbles: true,

                detail: {
                    element,
                    ...detail
                }
            })
        )
    }


    error(message) {

        throw new Error(
            `${this.constructor.name}: ${message}`
        )
    }
}


/* ============================================================
 * ResizeHandles
 * ============================================================ */
class ResizeHandles {

    static template = `
        <div class="rz tl" data-direction="tl"></div>
        <div class="rz tc" data-direction="t"></div>
        <div class="rz tr" data-direction="tr"></div>

        <div class="rz cl" data-direction="l"></div>
        <div class="rz cr" data-direction="r"></div>

        <div class="rz bl" data-direction="bl"></div>
        <div class="rz bc" data-direction="b"></div>
        <div class="rz br" data-direction="br"></div>
    `

    static apply(element) {

        if (
            element.querySelector(':scope > .rz')
        ) {
            element.classList.add('resizable')
            return
        }

        element.classList.add('resizable')

        element.insertAdjacentHTML(
            'beforeend',
            this.template
        )
    }

    static getDirection(target) {

        return target
            .closest('.rz')
            ?.dataset
            .direction ?? null
    }

    static isHandle(target) {

        return !!target.closest('.rz')
    }
}


/* ============================================================
 * Resizable
 * ============================================================ */
class Resizable extends ContainerInteractive {

    constructor(container, options = {}) {

        super(container, options)

        this.minWidth =
            options.minWidth ?? 40

        this.minHeight =
            options.minHeight ?? 40

        this.state = null
    }


    applyTo(element) {

        element =
            this.resolveElement(element)

        ResizeHandles.apply(element)

        if (!element.style.width) {

            element.style.width =
                `${this.minWidth}px`
        }

        if (!element.style.height) {

            element.style.height =
                `${this.minHeight}px`
        }

        return this
    }


    start(event) {

        const handle =
            event.target.closest('.rz')

        if (!handle) {
            return false
        }

        const element =
            handle.closest('.resizable')

        if (!element) {
            return false
        }

        const direction =
            ResizeHandles.getDirection(handle)

        if (!direction) {
            return false
        }

        const geometry =
            this.geometry(element)

        this.state =
            new InteractionState({

                element,

                pointerX:
                    event.clientX,

                pointerY:
                    event.clientY,

                geometry,

                type: 'resize',

                direction
            })

        this.dispatch(
            element,
            'transformstart',
            {
                type: 'resize',
                direction,
                initial: geometry.clone()
            }
        )

        return true
    }


    move(event) {

        if (!this.state) {
            return
        }

        const {
            element,
            initial,
            direction
        } = this.state

        const {
            x,
            y
        } =
            this.state.delta(event)

        /*
         * Calcula usando SEMPRE
         * o estado inicial.
         */
        let geometry =
            initial.resize(
                direction,
                x,
                y,
                this.minWidth,
                this.minHeight
            )

        /*
         * Aplica limites.
         */
        geometry =
            this.constraints.clampResize(
                geometry,
                initial,
                direction,
                this.minWidth,
                this.minHeight
            )

        this.applyGeometry(
            element,
            geometry
        )

        this.dispatch(
            element,
            'transform',
            {
                type: 'resize',
                direction,
                geometry: geometry.clone()
            }
        )
    }


    end() {

        if (!this.state) {
            return
        }

        const {
            element,
            initial,
            direction
        } = this.state

        const final =
            this.geometry(element)

        this.dispatch(
            element,
            'transformend',
            {
                type: 'resize',
                direction,
                initial: initial.clone(),
                final
            }
        )

        this.state = null
    }


    cancel() {

        this.end()
    }


    get isActive() {

        return !!this.state
    }
}


/* ============================================================
 * Draggable
 * ============================================================ */
class Draggable extends ContainerInteractive {

    constructor(container, options = {}) {

        super(container, options)

        this.enabledClass =
            options.enabledClass ??
            'draggable'

        this.activeClass =
            options.activeClass ??
            'dragging'

        this.state = null
    }


    applyTo(element) {

        element =
            this.resolveElement(element)

        element.classList.add(
            this.enabledClass
        )

        element.draggable = false

        return this
    }


    start(event) {

        /*
         * Resize tem prioridade.
         */
        if (
            event.target.closest('.rz')
        ) {
            return false
        }

        const element =
            event.target.closest(
                `.${this.enabledClass}`
            )

        if (!element) {
            return false
        }

        if (
            !this.container.contains(element)
        ) {
            return false
        }

        const geometry =
            this.geometry(element)

        this.state =
            new InteractionState({

                element,

                pointerX:
                    event.clientX,

                pointerY:
                    event.clientY,

                geometry,

                type: 'drag'
            })

        element.classList.add(
            this.activeClass
        )

        this.dispatch(
            element,
            'transformstart',
            {
                type: 'drag',
                initial: geometry.clone()
            }
        )

        return true
    }


    move(event) {

        if (!this.state) {
            return
        }

        const {
            element,
            initial
        } = this.state

        const {
            x,
            y
        } =
            this.state.delta(event)

        let geometry =
            initial.move(x, y)

        geometry =
            this.constraints.clampPosition(
                geometry
            )

        this.applyGeometry(
            element,
            geometry
        )

        this.dispatch(
            element,
            'transform',
            {
                type: 'drag',
                geometry: geometry.clone()
            }
        )
    }


    end() {

        if (!this.state) {
            return
        }

        const {
            element,
            initial
        } = this.state

        element.classList.remove(
            this.activeClass
        )

        const final =
            this.geometry(element)

        this.dispatch(
            element,
            'transformend',
            {
                type: 'drag',
                initial: initial.clone(),
                final
            }
        )

        this.state = null
    }


    cancel() {

        this.end()
    }


    get isActive() {

        return !!this.state
    }
}


/* ============================================================
 * Transformable
 * ============================================================ */
class Transformable {

    constructor(container, options = {}) {

        this.container =
            this.resolveElement(container)

        this.options = {

            draggable: true,
            resizable: true,

            minWidth: 40,
            minHeight: 40,

            enabledClass: 'draggable',
            activeClass: 'dragging',

            responsive: true,

            ...options
        }

        this.resizable =
            this.options.resizable
                ? new Resizable(
                    this.container,
                    this.options
                )
                : null

        this.draggable =
            this.options.draggable
                ? new Draggable(
                    this.container,
                    this.options
                )
                : null

        /*
         * Geometria responsiva de cada elemento.
         */
        this.normalizedGeometry =
            new Map()

        /*
         * Única interação ativa.
         */
        this.activeInteraction = null

        this.pointerId = null

        /*
         * Bind
         */
        this.commonEventListener = this.commonEventListener.bind(this)

        this.resize = this.resize.bind(this)

        this.bindEvents()

        if (this.options.responsive) {
            this.observeResize()
        }
    }


    resolveElement(element) {

        if (typeof element === 'string') {
            element =
                document.querySelector(element)
        }

        if (!(element instanceof Element)) {

            throw new Error(
                'Transformable: elemento não encontrado.'
            )
        }

        return element
    }


    applyTo(type, element) {

        const keys =
            type
                .split(/\s+/)
                .filter(Boolean)

        for (const key of keys) {

            const interaction =
                this[key]

            if (
                interaction &&
                typeof interaction.applyTo === 'function'
            ) {

                interaction.applyTo(element)
            }
        }

        /*
         * Guarda a geometria inicial.
         */
        this.saveResponsiveGeometry(
            this.resolveElement(element)
        )

        return this
    }


    saveResponsiveGeometry(element) {

        const geometry =
            this.geometry(element)

        const container =
            this.container.getBoundingClientRect()

        const normalized =
            ResponsiveGeometry.normalize(
                geometry,
                container.width,
                container.height
            )

        if (normalized) {

            this.normalizedGeometry.set(
                element,
                normalized
            )
        }
    }


    geometry(element) {

        const elementRect =
            element.getBoundingClientRect()

        const containerRect =
            this.container.getBoundingClientRect()

        const css =
            getComputedStyle(this.container)

        const borderLeft =
            parseFloat(
                css.borderLeftWidth
            ) || 0

        const borderTop =
            parseFloat(
                css.borderTopWidth
            ) || 0

        return new Geometry({

            left:
                elementRect.left -
                containerRect.left -
                borderLeft,

            top:
                elementRect.top -
                containerRect.top -
                borderTop,

            width:
                elementRect.width,

            height:
                elementRect.height
        })
    }


    applyGeometry(element, geometry) {

        element.style.left =
            `${geometry.left}px`

        element.style.top =
            `${geometry.top}px`

        element.style.width =
            `${geometry.width}px`

        element.style.height =
            `${geometry.height}px`
    }


    getInteraction(event) {

        /*
         * Resize sempre ganha.
         */
        if (
            this.resizable &&
            ResizeHandles.isHandle(event.target)
        ) {
            return this.resizable
        }

        /*
         * Drag.
         */
        if (this.draggable) {

            const target =
                event.target.closest(
                    `.${this.draggable.enabledClass}`
                )

            if (target) {
                return this.draggable
            }
        }

        return null
    }


    commonEventListener(event) {

        /*
         * =====================================================
         * POINTER DOWN
         * =====================================================
         */

        if (event.type === 'pointerdown') {

            if (this.activeInteraction) return;
            if (event.button !== undefined && event.button !== 0) return;

            const interaction = this.getInteraction(event)
            if (!interaction) return;

            const started = interaction.start(event)
            if (!started) return;


            this.activeInteraction = interaction
            this.pointerId = event.pointerId

            /*
             * Capture no container.
             */
            try {
                this.container.setPointerCapture(event.pointerId)
            } catch { }
        }


        /*
         * =====================================================
         * POINTER MOVE
         * =====================================================
         */

        else if (event.type === 'pointermove') {

            if (!this.activeInteraction) return;
            if (this.pointerId !== event.pointerId) return;

            this.activeInteraction.move(event)
        }


        /*
         * =====================================================
         * POINTER UP / CANCEL
         * =====================================================
         */

        else if (event.type === 'pointerup' || event.type === 'pointercancel') {

            if (!this.activeInteraction) return;

            if (this.pointerId !== event.pointerId) return;
            if (event.type === 'pointercancel') {
                this.activeInteraction.cancel()
            } else {
                this.activeInteraction.end(event)
            }

            this.releasePointer(event.pointerId)

            this.activeInteraction = null
            this.pointerId = null
        }
    }


    releasePointer(pointerId) {

        try {

            if (
                this.container.hasPointerCapture?.(
                    pointerId
                )
            ) {

                this.container.releasePointerCapture(
                    pointerId
                )
            }

        } catch { }
    }


    /* ========================================================
     * RESPONSIVE
     * ======================================================== */

    observeResize() {

        if (
            typeof ResizeObserver === 'undefined'
        ) {
            return
        }

        this.resizeObserver =
            new ResizeObserver(
                this.resize
            )

        this.resizeObserver.observe(
            this.container
        )
    }


    resize(entries) {

        if (
            !this.options.responsive
        ) {
            return
        }

        if (
            this.activeInteraction
        ) {
            /*
             * Não altera geometria durante drag/resize.
             */
            return
        }

        const entry =
            entries?.[0]

        if (!entry) {
            return
        }

        const width =
            entry.contentRect.width

        const height =
            entry.contentRect.height

        if (
            width <= 0 ||
            height <= 0
        ) {
            return
        }

        for (
            const [
                element,
                normalized
            ]
            of this.normalizedGeometry
        ) {

            if (
                !element.isConnected ||
                !this.container.contains(element)
            ) {
                this.normalizedGeometry.delete(
                    element
                )

                continue
            }

            let geometry =
                ResponsiveGeometry.denormalize(
                    normalized,
                    width,
                    height
                )

            /*
             * Mantém o elemento dentro do container.
             */
            geometry =
                this.getConstraints()
                    .clampPosition(
                        geometry
                    )

            this.applyGeometry(
                element,
                geometry
            )
        }
    }


    getConstraints() {

        return new Constraints(
            this.container,
            this.options
        )
    }


    /*
     * Chamado depois de drag/resize.
     *
     * A geometria final em pixels vira novamente
     * uma geometria normalizada.
     */
    updateResponsiveGeometry(element) {

        const geometry =
            this.geometry(element)

        const rect =
            this.container.getBoundingClientRect()

        const normalized =
            ResponsiveGeometry.normalize(
                geometry,
                rect.width,
                rect.height
            )

        if (normalized) {

            this.normalizedGeometry.set(
                element,
                normalized
            )
        }
    }


    bindEvents() {

        const events = [
            'pointerdown', 'pointermove', 'pointerup', 'pointercancel'
        ]

        for (const type of events) {
            this.container.addEventListener(type, this.commonEventListener)
        }
    }


    unbindEvents() {
        const events = [
            'pointerdown', 'pointermove', 'pointerup', 'pointercancel'
        ]
        for (const type of events) {
            this.container.removeEventListener(type, this.commonEventListener)
        }
    }


    destroy() {

        this.unbindEvents()

        this.resizeObserver?.disconnect()
        this.activeInteraction?.cancel?.()
        this.activeInteraction = null
        this.normalizedGeometry.clear()
    }
}
