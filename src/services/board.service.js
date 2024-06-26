import { storageService } from './async-storage.service'
import { httpService } from './http.service'
import { utilService } from './util.service'

const BOARDS_KEY = 'boardDB'

export const boardService = {
  query,
  getById,
  remove,
  save,
  getDefaultBoardFilter,
  getDefaultGroupTaskFilter,
  getDefaultSortBy,
  getGroupById,
  removeGroup,
  saveGroup,
  removeTask,
  saveTask,
  getEmptyTask,
  getEmptyComment,
  getEmptyBoard,
  getEmptyGroup,
  getPerson,
  getPersonUrl,
  getTotalTasksByBoard,
  getColTitle,
  getGroupColors,
  getLabelColors,
  getRandLabelColor,
  getTaskById,
  filterBoard,
  sortBoard,
}

function query(boardFilterBy) {
  return httpService.get('board', boardFilterBy)
}

function getById(boardId) {
  return httpService.get(`board/${boardId}`)
}

function remove(boardId) {
  return httpService.delete(`board/${boardId}`)
}

function save(board) {
  if (board._id) {
    return httpService.put(`board/${board._id}`, board)
  } else {
    return httpService.post('board', board)
  }
}

function filterBoard(board, filterBy) {
  let groupsToReturn = board.groups.slice()

  if (filterBy.txt) {
    const regExp = new RegExp(filterBy.txt, 'i')

    const groupsFilteredByTitle = groupsToReturn.filter(group => regExp.test(group.title))

    const filteredTasksGroups = groupsToReturn.filter(group =>
      group.tasks?.some(t => regExp.test(t.title))
    )
    const filteredAll = filteredTasksGroups.map(group => {
      const filteredGroup = group.tasks.filter(t => regExp.test(t.title))
      return { ...group, tasks: filteredGroup }
    })

    groupsToReturn = [...groupsFilteredByTitle, ...filteredAll]
  }

  if (filterBy.person) {
    const personGroups = groupsToReturn.filter(group =>
      group.tasks.some(t => t.personsIds?.includes(filterBy.person))
    )
    const groupWithPersonTasks = personGroups.map(group => {
      const filteredGroup = group.tasks.filter(t => t.personsIds?.includes(filterBy.person))
      return { ...group, tasks: filteredGroup }
    })

    groupsToReturn = [...groupWithPersonTasks]
  }

  // Remove duplicate groups
  groupsToReturn = groupsToReturn.reduce((unique, item) => {
    return unique.some(u => u.id === item.id) ? unique : [...unique, item]
  }, [])
  return groupsToReturn
}

function sortBoard(board, sortBy) {
  let groupsToReturn = board.groups.slice()

  groupsToReturn = groupsToReturn.map(group => {
    let sortedTasks = null

    if (sortBy.txt) {
      sortedTasks = group.tasks.sort((t1, t2) => t1.title.localeCompare(t2.title) * sortBy.txt)
    }

    if (sortBy.person) {
      sortedTasks = _sortByPersons(board, group, sortBy)
    }

    if (sortBy.status) {
      sortedTasks = _sortByStatus(group, sortBy)
    }

    if (sortBy.priority) {
      sortedTasks = _sortByPriority(group, sortBy)
    }

    if (sortBy.timeline) {
      sortedTasks = _sortByTimeline(group, sortBy)
    }

    return { ...group, tasks: sortedTasks || group.tasks }
  })

  return groupsToReturn
}

function getPerson(board, personId) {
  return board.persons.find(p => p.id === personId)
}

function getPersonUrl(board, personId) {
  const person = board.persons.find(p => p.id === personId)
  return person?.imgUrl
}

function getTotalTasksByBoard(board) {
  let totalTasks = 0
  board?.groups.forEach(group => (totalTasks += group.tasks.length))
  return totalTasks
}

function getColTitle(cmp) {
  switch (cmp) {
    case 'PersonPicker':
      return 'Person'
    case 'StatusPicker':
      return 'Status'
    case 'PriorityPicker':
      return 'Priority'
    case 'TimelinePicker':
      return 'Timeline'
    case 'FilesPicker':
      return 'Files'
    default:
      cmp
  }
}

function getDefaultBoardFilter() {
  return { txt: '' }
}

function getDefaultSortBy() {
  return null
}

// * --------------------------------- GROUPS ---------------------------------

function getDefaultGroupTaskFilter() {
  return { txt: '', person: null }
}

function removeGroup(board, groupId) {
  const groupIdx = board.groups.findIndex(group => group.id === groupId)
  if (groupIdx < 0) {
    throw new Error(`Update failed, cannot find group with id: ${groupId}`)
  }
  board.groups.splice(groupIdx, 1)
  return save(board)
}

function saveGroup(board, group) {
  if (group.id) {
    return _updateGroup(board, group)
  } else {
    return _addGroup(board, group)
  }
}

function getGroupById(board, groupId) {
  const group = board.groups.find(group => group.id === groupId)
  return group
}

function _addGroup(board, group) {
  group.id = utilService.makeId()
  board.groups.push(group)
  return save(board)
}

function _updateGroup(board, group) {
  const groupIdx = board.groups.findIndex(currGroup => currGroup.id === group.id)
  if (groupIdx < 0) {
    throw new Error(`Update failed, cannot find group with id: ${group.id}`)
  }
  board.groups.splice(groupIdx, 1, group)
  return save(board)
}

// * --------------------------------- TASKS ---------------------------------

function removeTask(board, group, taskId) {
  const taskIdx = group.tasks.findIndex(task => task.id === taskId)
  if (taskId < 0) {
    throw new Error(`Update failed, cannot find task with id: ${taskId}`)
  }
  group.tasks.splice(taskIdx, 1)
  return save(board)
}

function saveTask(board, group, task, unshift) {
  if (task.id) {
    return _updateTask(board, group, task)
  } else {
    return _addTask(board, group, task, unshift)
  }
}

function getTaskById(board, taskId) {
  const taskGroup = board.groups.find(group => group.tasks.some(t => t.id === taskId))
  if (!taskGroup) throw new Error('Cannot find tasks in board')

  const task = taskGroup.tasks.find(currTask => currTask.id === taskId)
  return [taskGroup, task]
}

function _addTask(board, group, task, unshift = false) {
  task.id = utilService.makeId()

  unshift ? group.tasks.unshift(task) : group.tasks.push(task)
  return saveGroup(board, group)
}

function _updateTask(board, group, task) {
  const taskIdx = group.tasks.findIndex(currTask => currTask.id === task.id)
  if (taskIdx < 0) {
    throw new Error(`Update failed, cannot find task with id: ${task.id}`)
  }
  group.tasks.splice(taskIdx, 1, task)
  return saveGroup(board, group)
}

function getGroupColors() {
  return [
    'rgb(3, 127, 76)',
    'rgb(0, 200, 117)',
    'rgb(156, 211, 38)',
    'rgb(202, 182, 65)',
    'rgb(255, 203, 0)',
    'rgb(120, 75, 209)',
    'rgb(157, 80, 221)',
    'rgb(0, 126, 181)',
    'rgb(87, 155, 252)',
    'rgb(102, 204, 255)',
    'rgb(187, 51, 84)',
    'rgb(223, 47, 74)',
    'rgb(255, 0, 127)',
    'rgb(255, 90, 196)',
    'rgb(255, 100, 46)',
    'rgb(127, 83, 71)',
    'rgb(196, 196, 196)',
    'rgb(117, 117, 117)',
  ]
}

function getLabelColors() {
  return [
    '#037f4c',
    '#00c875',
    '#9cd326',
    '#cab641',
    '#ffcb00',
    '#fdab3d',
    '#ff6d3b',
    '#ffadad',
    '#ff7575',
    '#bb3354',
    '#df2f4a',
    '#e50073',
    '#ff5ac4',
    '#faa1f1',
    '#9d50dd',
    '#784bd1',
    '#7e3b8a',
    '#401694',
    '#5559df',
    '#225091',
    '#579bfc',
    '#007eb5',
    '#4eccc6',
    '#66ccff',
    '#74afcc',
    '#9aadbd',
    '#757575',
    '#333333',
    '#e484bd',
    '#bca58a',
    '#a1e3f6',
    '#216edf',
    '#175a63',
    '#bda8f9',
    '#a9bee8',
    '#9d99b9',
  ]
}

function getEmptyComment() {
  return {
    txt: '',
    byPerson: null,
    createdAt: null,
    id: null,
  }
}

////////////////////////////////////////////////////

function _sortByPersons(board, group, sortBy) {
  const tasksWithFullUsers = group.tasks.map(task => {
    let taskFullPersons = []

    if (task.personsIds && task.personsIds.length) {
      taskFullPersons = task.personsIds.map(id => getPerson(board, id))
    } else {
      taskFullPersons = [{ fullName: 'zzzzz' }]
    }

    return { ...task, taskFullPersons }
  })

  tasksWithFullUsers.forEach(task =>
    task.taskFullPersons?.sort((p1, p2) => p1.fullName.localeCompare(p2.fullName))
  )

  const sortedTasks = tasksWithFullUsers.sort(
    (t1, t2) =>
      t1.taskFullPersons[0].fullName.localeCompare(t2.taskFullPersons[0].fullName) * sortBy.person
  )

  sortedTasks.forEach(task => delete task.taskFullPersons)
  return sortedTasks
}

function _sortByStatus(group, sortBy) {
  const sortedTasks = group.tasks.sort(
    (t1, t2) => t1.status.localeCompare(t2.status) * sortBy.status
  )

  return sortedTasks
}

function _sortByPriority(group, sortBy) {
  const sortedTasks = group.tasks.sort(
    (t1, t2) => t1.priority.localeCompare(t2.priority) * sortBy.priority
  )

  return sortedTasks
}

function _sortByTimeline(group, sortBy) {
  const sortedTasks = group.tasks.sort((t1, t2) => {
    const task1Copy = structuredClone(t1)
    const task2Copy = structuredClone(t2)

    if (!t1.timeline) task1Copy.timeline = { startDate: 0 }
    if (!t2.timeline) task2Copy.timeline = { startDate: 0 }

    return (task2Copy.timeline.startDate - task1Copy.timeline.startDate) * sortBy.timeline
  })

  return sortedTasks
}

function getEmptyBoard() {
  return {
    title: 'New Board',
    isStarred: false,
    archivedAt: null,
    statuses: [
      {
        id: 's101',
        title: 'Done',
        color: '#00c875',
      },
      {
        id: 's102',
        title: 'Working on it',
        color: '#fdab3d',
      },
      {
        id: 's103',
        title: 'Stuck',
        color: '#df2f4a',
      },
      {
        id: 's104',
        title: '',
        color: '#c4c4c4',
      },
    ],
    persons: [
      {
        id: 'u101',
        fullName: 'Atar Mor',
        imgUrl:
          'https://res.cloudinary.com/dkmvaqxkl/image/upload/v1713439122/of43ydrlcijxmzwcpmsd.jpg',
        phoneNumber: '0545613742',
        email: 'atarmor92@gmail.com',
      },
      {
        id: 'u102',
        fullName: 'Ido Yotvat',
        imgUrl: 'https://res.cloudinary.com/df6vvhhoj/image/upload/v1712168994/ido_ds25mn.jpg',
        phoneNumber: '0506398851',
        email: 'idooy11@gmail.com',
      },
      {
        id: 'u103',
        fullName: 'Ron Felsenfeld',
        imgUrl: 'https://res.cloudinary.com/df6vvhhoj/image/upload/v1712168995/ron_hzfvru.jpg',
        phoneNumber: '0544419922',
        email: 'ronfelsenfeld@gmail.com',
      },
    ],
    priorities: [
      {
        id: 'pri101',
        title: `Critical \u{26A0}`,
        color: '#333333',
      },
      {
        id: 'pri102',
        title: 'High',
        color: '#401694',
      },
      {
        id: 'pri103',
        title: 'Medium',
        color: '#5559df',
      },
      {
        id: 'pri104',
        title: 'Low',
        color: '#579bfc',
      },
      {
        id: 'pri105',
        title: '',
        color: '#c4c4c4',
      },
    ],
    groups: [
      {
        id: utilService.makeId(),
        title: 'Group 1',
        archivedAt: null,
        tasks: [
          {
            id: utilService.makeId(),
            title: 'task 1',
            personsIds: ['u101'],
            status: 's102',
            priority: 'pri104',
            timeline: {
              startDate: 1712077970111,
              dueDate: 1712250770111,
            },
            comments: [],
            activities: [],
          },
          {
            id: utilService.makeId(),
            title: 'task 2',
            personsIds: ['u103'],
            status: 's101',
            priority: 'pri103',
            timeline: {
              startDate: 1712164370111,
              dueDate: 1712941970111,
            },
            comments: [],
            activities: [],
          },
          {
            id: utilService.makeId(),
            title: 'task 3',
            personsIds: ['u101', 'u102', 'u103'],
            status: 's103',
            priority: 'pri105',
            timeline: {
              startDate: 1711991570111,
              dueDate: 1712337170111,
            },
            comments: [],
            activities: [],
            files: [
              {
                type: 'jpg',
                url: 'https://res.cloudinary.com/dkmvaqxkl/image/upload/v1713019203/uc8cbiodqflqhewr2f8d.jpg',
                desc: 'How to modal',
              },
            ],
          },
        ],
        style: {
          color: '#579bfc',
        },
      },
      {
        id: utilService.makeId(),
        title: 'Group 2',
        archivedAt: null,
        tasks: [
          {
            id: utilService.makeId(),
            title: 'task 1',
            status: 's104',
            priority: 'pri105',
            personsIds: ['u101', 'u103'],
            timeline: {
              startDate: 1711991570111,
              dueDate: 1712337170111,
            },
            comments: [],
            activities: [],
            files: [
              {
                type: 'jpg',
                url: 'https://res.cloudinary.com/dkmvaqxkl/image/upload/v1713006218/nbgwkn5rga3yqmqc1tk9.jpg',
                desc: 'how to',
              },
            ],
          },
          {
            id: utilService.makeId(),
            title: 'task 2',
            personsIds: ['u102'],
            status: 's104',
            priority: 'pri105',
            timeline: {
              startDate: 1711991570111,
              dueDate: 1712164370111,
            },
            comments: [],
            activities: [],
            files: [
              {
                type: 'pdf',
                url: 'https://res.cloudinary.com/dkmvaqxkl/image/upload/v1713011807/or7snd8m1oxfh93v9wro.pdf',
                desc: 'Forme 1.png',
              },
            ],
          },
        ],
        style: {
          color: '#037f4c',
        },
      },
    ],
    activities: [],
    cmpsOrder: ['PersonPicker', 'StatusPicker', 'PriorityPicker', 'TimelinePicker', 'FilesPicker'],
  }
}

function getEmptyTask(title = '') {
  return {
    title,
    personsId: [],
    status: 's104',
    priority: 'pri105',
    comments: [],
    activities: [],
  }
}

function getEmptyGroup() {
  return {
    title: 'New Group',
    archivedAt: null,
    tasks: [],
    style: {
      color: _getRandGroupColor(),
    },
  }
}

function getRandLabelColor() {
  const colors = getLabelColors()
  return colors[utilService.getRandomIntInclusive(0, colors.length - 1)]
}

function _getRandGroupColor() {
  const groupColors = [
    'rgb(3, 127, 76)',
    'rgb(0, 200, 117)',
    'rgb(156, 211, 38)',
    'rgb(202, 182, 65)',
    'rgb(255, 203, 0)',
    'rgb(120, 75, 209)',
    'rgb(0, 126, 181)',
    'rgb(87, 155, 252)',
    'rgb(102, 204, 255)',
    'rgb(187, 51, 84)',
    'rgb(223, 47, 74)',
    'rgb(255, 0, 127)',
    'rgb(255, 90, 196)',
    'rgb(255, 100, 46)',
    'rgb(127, 83, 71)',
    'rgb(196, 196, 196)',
    'rgb(117, 117, 117)',
  ]

  return groupColors[utilService.getRandomIntInclusive(0, groupColors.length - 1)]
}
