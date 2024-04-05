export const SET_BOARDS = 'SET_BOARDS'
export const REMOVE_BOARD = 'REMOVE_BOARD'
export const ADD_BOARD = 'ADD_BOARD'
export const EDIT_BOARD = 'EDIT_BOARD'

const initialState = {
    boards: []
}

export function boardReducer(state = initialState, action = {}) {
    switch (action.type) {
        case SET_BOARDS:
            return { 
                ...state, boards: action.boards }
        case REMOVE_BOARD:
            return {
                ...state, boards: state.boards.filter(board =>
                    board._id !== action.boardId)
            }
        case ADD_BOARD:
            return {
                ...state, boards: [...state.boards, action.board]
            }
        case EDIT_BOARD:
            return {
                ...state, boards: state.boards.map(board =>
                    board._id === action.board._id ? action.board : board)
            }
        default:
            return state
    }
}