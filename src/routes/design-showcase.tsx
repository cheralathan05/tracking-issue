import { createFileRoute } from '@tanstack/react-router'
import DesignShowcase from '@/components/chat/DesignShowcase'

export const Route = createFileRoute('/design-showcase')({
  component: DesignShowcasePage,
})

function DesignShowcasePage() {
  return <DesignShowcase />
}
