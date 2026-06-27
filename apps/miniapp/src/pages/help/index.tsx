import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import NavBar from '../../components/NavBar'
import Skeleton from '../../components/Skeleton'
import Icon from '../../components/Icon'
import { getHelpArticles, showApiError } from '../../services'
import type { HelpArticle } from '../../types'
import './index.scss'

export default function Help() {
  const [articles, setArticles] = useState<HelpArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    getHelpArticles()
      .then(setArticles)
      .catch((err) => showApiError(err, '帮助文章加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const grouped = articles.reduce<Record<string, HelpArticle[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})
  const categories = Object.keys(grouped)

  const toggleExpand = (id: number) => {
    setExpandedId((cur) => (cur === id ? null : id))
  }

  return (
    <View className='help-page'>
      <NavBar title='帮助中心' />
      <ScrollView className='help-body' scrollY>
        {loading ? (
          <>
            <Skeleton rows={2} />
            <Skeleton rows={2} />
            <Skeleton rows={2} />
          </>
        ) : articles.length === 0 ? (
          <View className='help-empty'>
            <Icon name='help-circle' size={96} color='#94A3B8' />
            <Text className='help-empty-text'>暂无帮助文章</Text>
          </View>
        ) : (
          <>
            {categories.map((cat) => (
              <View key={cat} className='help-section'>
                <Text className='help-section-title'>{cat}</Text>
                <View className='help-card'>
                  {grouped[cat].map((article, index) => (
                    <View key={article.id}>
                      <View className='help-item' onClick={() => toggleExpand(article.id)}>
                        <Text className='help-item-title'>{article.title}</Text>
                        <Icon
                          name='chevron-right'
                          size={28}
                          color='#94A3B8'
                          className={expandedId === article.id ? 'help-chevron--expanded' : ''}
                        />
                      </View>
                      {expandedId === article.id && (
                        <View className='help-item-content'>
                          <Text className='help-item-content-text'>{article.content}</Text>
                        </View>
                      )}
                      {index < grouped[cat].length - 1 && <View className='help-divider' />}
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <View className='safe-bottom' />
          </>
        )}
      </ScrollView>
    </View>
  )
}
