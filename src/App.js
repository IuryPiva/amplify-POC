import React, { Component } from "react"
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import { onCreateNote, onDeleteNote, onUpdateNote } from "./graphql/subscriptions";

class App extends Component {
  state = {
    note: "",
    notes: [],
    id: ""
  }

  componentDidMount() {
    this.getNotes()
    API.graphql(graphqlOperation(onCreateNote)).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote
        const prevNotes = this.state.notes.filter(note => note.id !== newNote.id)

        const updatedNotes = [...prevNotes, newNote]

        this.setState({ notes: updatedNotes})
      }
    })
    API.graphql(graphqlOperation(onDeleteNote)).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote
        const prevNotes = this.state.notes.filter(note => note.id !== deletedNote.id)

        const updatedNotes = [...prevNotes]

        this.setState({ notes: updatedNotes})
      }
    })
    API.graphql(graphqlOperation(onUpdateNote)).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote

        const updatedNotes = this.state.notes.map(oldNote => {
          if(oldNote.id === updatedNote.id) oldNote.note = updatedNote.note
          return oldNote
        })

        this.setState({ notes: updatedNotes})
      }
    })
  }

  getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes))
    this.setState({ notes: result.data.listNotes.items })
  }

  handleChangeNote = event => this.setState({ note: event.target.value })

  hasExistingNote = () => {
    const { notes, id } = this.state

    if(id) {
      return notes.findIndex(note => note.id === id) > -1
    }
    return false
  }

  handleAddNote = async event => {
    event.preventDefault()

    const { note } = this.state

    if(this.hasExistingNote()) {
      this.handleUpdateNote()
    } else {
      await API.graphql(
        graphqlOperation(createNote, {input: {note}})
      )
      this.setState({ note: '' })
    }
  }

  handleUpdateNote = () => {
    const { id, note } = this.state
    API.graphql(graphqlOperation(updateNote, { input: { id, note }}))

    this.setState({ note: '', id: '' })
  }

  handleDeleteNote = noteId => API.graphql(graphqlOperation(deleteNote, { input: { id : noteId } }))
  
  handleSetNote = ({ note, id }) => this.setState({ note, id })

  render() {
    return (
      <div className="flex flex-column items-center justify-center pa3 bg-light-gray">
        <h1 className="code f2-l" children="Amplify Notetaker" />
        <form onSubmit={this.handleAddNote} className="mb3">
          <input onChange={this.handleChangeNote} value={this.state.note}
          type="text" className="pa2 f4" placeholder="Write your note" />
          <button className="pa2 f4" children={this.state.id ? "Update note" : "Add note" }/>
        </form>
        <div>
          {this.state.notes.map(item => (
            <div key={item.id} className="flex items-center">
              <li onClick={() => this.handleSetNote(item)} className="list pa1 f3">{item.note}</li>
              <button onClick={() => this.handleDeleteNote(item.id)} className="bg-transparent bn f4"><span>&times;</span></button>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

export default App
