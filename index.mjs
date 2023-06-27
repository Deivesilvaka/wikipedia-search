import wikipedia from 'wikipedia'
import sentenceBoundaryDetection  from 'sbd'

export class Wikipedia {

    #sentencesQuantity = 0

    constructor(query, sentencesQuantity = 10) {
        this.query = query
        this.description = ''
        this.content = {}
        this.#sentencesQuantity = sentencesQuantity
        this.sentences = []
    }

    #breakContentIntoSentences(content) {
        const sentences = sentenceBoundaryDetection.sentences(content)
        
        for(let sentence = 0; sentence <= this.#sentencesQuantity; sentence++){
            this.sentences.push(sentences[sentence])
        }
        return
    }

    #removeBlankLinesAndMarkDown(text) {
    
        const allLines = text.split('\n')
    
        const withoutBlankLinesAndMarkDown = allLines.filter((line) => {
            if(line.trim().length === 0 || line.trim().startsWith('=')){
                return false
            }
            return true
        })
        return this.#removeDateInParenteses(withoutBlankLinesAndMarkDown.join(' '))
    }

    #removeDateInParenteses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }

    async search(lang = 'pt') {
        try {
            await wikipedia.setLang(lang)

            const apiContent = await wikipedia.page(this.query, {
                autoSuggest: true,
            })
        
            const [intro, images, summary, content, references] = await Promise.all([
                apiContent.intro(),
                apiContent.images(),
                apiContent.summary(),
                apiContent.content(),
                apiContent.references()
            ])
            
            this.description = summary.description

            const sanitizedContent = this.#removeBlankLinesAndMarkDown(content)
            this.#breakContentIntoSentences(sanitizedContent)
    
            this.content = {
                intro,
                images,
                summary: this.#removeBlankLinesAndMarkDown(summary.extract),
                content: sanitizedContent,
                references
            }
    
            return this
        } catch (err) {
            return {
                error: 'Objeto não encontrado'
            }
        }
    }
}

console.log(await new Wikipedia('Michael Jackson').search())