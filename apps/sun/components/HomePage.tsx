'use client'

import { Box, Container, Flex, Heading, HStack, Text } from '@chakra-ui/react'

import { DynamicMapViewer } from './DynamicMapViewer'
import { ThemeToggle } from './ThemeToggle'

export function HomePage() {
  return (
    <Box bg="bg" color="fg" minH="100dvh" display="flex" flexDirection="column">
      {/* Header */}
      <Box as="header" borderBottom="1px solid" borderColor="border.muted" flexShrink={0}>
        <Container maxW="full" py={3} px={4}>
          <Flex align="center" justify="space-between">
            <HStack gap={3}>
              <Box
                alignItems="center"
                bg="red.600"
                color="white"
                display="flex"
                fontSize="sm"
                fontWeight="bold"
                h={9}
                justifyContent="center"
                rounded="lg"
                w={9}
              >
                毛
              </Box>
              <Box>
                <Text fontSize="lg" fontWeight="semibold">
                  毛泽东思想履历地图
                </Text>
              </Box>
            </HStack>

            <HStack gap={4}>
              <ThemeToggle />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Map Container */}
      <Box flex="1" minH={0} position="relative" overflow="hidden">
        <DynamicMapViewer className="cesium-viewer" />
      </Box>

      {/* Footer */}
      <Box
        as="footer"
        borderTop="1px solid"
        borderColor="border.muted"
        flexShrink={0}
        bg="bg"
      >
        <Container maxW="full" py={2} px={4}>
          <Text fontSize="xs" color="fg.muted" textAlign="center">
            数据来源：公开历史资料 · 地图服务：天地图
          </Text>
        </Container>
      </Box>
    </Box>
  )
}
