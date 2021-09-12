/** this is the outermost abstraction that contains absolutely every bit of lolgc */
export class Game {
    constructor(states) {
        this.states = states;
    }
    setState(state) {
        var _a, _b;
        if ((_a = this.state) === null || _a === void 0 ? void 0 : _a.onLeave)
            this.state.onLeave();
        this.state = state;
        if ((_b = this.state) === null || _b === void 0 ? void 0 : _b.onEnter)
            this.state.onEnter();
    }
}
