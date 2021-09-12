export class Game {
    async setState(state) {
        var _a, _b;
        if ((_a = this.state) === null || _a === void 0 ? void 0 : _a.onLeave) {
            this.state.onLeave();
        }
        this.state = state;
        if ((_b = this.state) === null || _b === void 0 ? void 0 : _b.onEnter) {
            let result = this.state.onEnter();
            if (result instanceof Promise) {
                return result.then(() => {
                    this.setState(null);
                });
            }
        }
        return Promise.resolve();
    }
}
