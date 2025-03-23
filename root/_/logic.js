import $ from 'jquery'

export const prevCard = ({ root }) => {
  root.currentIndex = (root.currentIndex - 1 + root.cards.length) % root.cards.length
  root.isFlipped = false
}

export const nextCard = ({ root }) => {
  root.currentIndex = (root.currentIndex + 1) % root.cards.length
  root.isFlipped = false
}

export const flipCard = ({ root }) => {
  root.isFlipped = !root.isFlipped
}

export default function ({ card, front, back, question, answer, currentIndex, totalCards }, { root }) {
  // Update card content
  $(question).text(root.cards[root.currentIndex].question)
  $(answer).text(root.cards[root.currentIndex].answer)
  
  // Update card flip state
  if (root.isFlipped) {
    $(card).addClass('flipped')
  } else {
    $(card).removeClass('flipped')
  }
  
  // Update progress
  $(currentIndex).text(root.currentIndex + 1)
  $(totalCards).text(root.cards.length)
} 