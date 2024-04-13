import { useSelector } from 'react-redux'
import { boardService } from '../services/board.service'
import { hideModal, showModal } from '../store/actions/system.actions'
import { BOTTOM_CENTER } from '../store/reducers/system.reducer'
import { saveTask } from '../store/actions/board.actions'
import { utilService } from '../services/util.service'

export function TaskPerson({ group, task }) {
  const board = useSelector(storeState => storeState.boardModule.currentBoard)
  const user = useSelector(storeState => storeState.userModule.loggedInUser)
  const guest = { fullName: 'Guest', imgUrl: '/assets/img/user-avatar.svg', id: 'guest101' }


  async function onAddPerson(personId) {
    const currActivity = { id: utilService.makeId(), byPerson: user || guest, action: 'Changed person', createdAt: Date.now() }
    const editedTask = task.personsIds
      ? { ...task, personsIds: [...task.personsIds, personId], activities: [...task.activities, currActivity] }
      : { ...task, personsIds: [personId], activities: [...task.activities, currActivity] }

    try {
      await saveTask(board, group, editedTask)
      console.log(editedTask);
      hideModal()
    } catch (err) {
      console.log('Had issues updating task persons', err)
    }
  }

  async function onRemovePerson(personId) {
    const currActivity = { id: utilService.makeId(), byPerson: user || guest, action: 'Changed person', createdAt: Date.now() }
    const editedTask = { ...task, personsIds: task.personsIds.filter(id => id !== personId), activities: [...task.activities, currActivity] }

    try {
      await saveTask(board, group, editedTask)
      hideModal()
    } catch (err) {
      console.log('Had issues updating task persons', err)
    }
  }

  const taskPersons = task.personsIds?.map(id => boardService.getPerson(board, id))

  const suggestedPersons = board.persons.filter(person => !task.personsIds?.includes(person.id))

  function handlePickerClick({ currentTarget }) {
    const cmpInfo = {
      type: 'personPicker',
      taskPersons,
      suggestedPersons,
      onAddPerson,
      onRemovePerson,
    }

    showModal(currentTarget, BOTTOM_CENTER, cmpInfo, true)
  }

  return (
    <div onClick={handlePickerClick} className="task-row task-persons-img">
      <button className="add-person-btn fa-solid plus"></button>
      {(!taskPersons || !taskPersons.length) && (
        <img src={'/assets/img/user-avatar.svg'} alt="person-icon" />
      )}
      {taskPersons && taskPersons.length > 2 && (
        <>
          {taskPersons[0].imgUrl ? (
            <>
              <img
                key={taskPersons[0].id}
                src={taskPersons[0].imgUrl}
                alt={taskPersons[0].fullName}
              />
            </>
          ) : (
            <div className="person-initials">
              {utilService.getInitials(taskPersons[0].fullName)}
            </div>
          )}
          <span className="person-count">+{taskPersons.length - 1}</span>
        </>
      )}
      {taskPersons &&
        taskPersons.length <= 2 &&
        taskPersons.map(person =>
          person.imgUrl ? (
            <img key={person.id} src={person.imgUrl} alt={person.fullName} />
          ) : (
            <div key={person.id} className="person-initials">
              {utilService.getInitials(person.fullName)}
            </div>
          )
        )}
    </div>
  )
}
