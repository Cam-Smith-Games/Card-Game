/** each state is essentially a game of it's own. 
 * it contains it's own definable logic for doing things upon entering, exiting, looping, etc
 * @remarks NOTE: you can use multi-level inheritance to create sub-states and re-use parent properties (ie class A implements GameState, class B extends A, etc)  */
export interface GameState {
    /** optional event to trigger upon entering this state. if this method returns a promise, the state will automatically exit when it resolves */
    onEnter?: () => void | Promise<void>;
    /** optional event to trigger upon leaving this state */
    onLeave?: () => void;

}



export class Game {
    state: GameState;

    async setState(state:GameState) {
        if (this.state?.onLeave) {
            this.state.onLeave();
        }

        this.state = state;

        if (this.state?.onEnter) {
            let result = this.state.onEnter();
            if (result instanceof Promise) {
                return result.then(() =>{
                    this.setState(null);
                })
            }
        }

        return Promise.resolve();
    }
}