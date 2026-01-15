'use client'

import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'

import { ThemeToggle } from './ThemeToggle'

const stats = [
  { value: '2x', label: '交付速度提升' },
  { value: '48%', label: '会议时间降低' },
  { value: '7 天', label: '落地平均周期' },
]

const features = [
  {
    title: '结构化项目流',
    description: '统一看板、里程碑与时间线，帮助你用更少会议同步方向。',
  },
  {
    title: '协作资产沉淀',
    description: '讨论、资料与决策记录自动归档，随时可追溯。',
  },
  {
    title: '节奏可视化',
    description: '关键指标实时更新，风险提前预警，确保目标落地。',
  },
]

const steps = [
  {
    step: '01',
    title: '建立工作区',
    description: '选择团队模板与权限角色，完成基础配置。',
  },
  {
    step: '02',
    title: '导入项目节奏',
    description: '里程碑与任务模板一键生成，快速进入执行。',
  },
  {
    step: '03',
    title: '持续运营',
    description: '仪表盘与周报自动生成，帮助管理层掌握全局。',
  },
]

const insights = [
  {
    title: '本周摘要',
    value: '12 项里程碑推进',
    description: '需求到交付的平均周期缩短了 3.4 天。',
  },
  {
    title: '风险预警',
    value: '2 个模块待评审',
    description: '系统已自动通知相关负责人完成校验。',
  },
]

const tags = ['会议纪要', '风险追踪', '协作日报']

export function HomePage() {
  return (
    <Box bg="bg" color="fg" minH="100dvh">
      <Box as="header" borderBottom="1px solid" borderColor="border.muted">
        <Container maxW="6xl" py={4}>
          <Flex align="center" justify="space-between">
            <HStack spacing={3}>
              <Box
                alignItems="center"
                bg="gray.900"
                color="white"
                display="flex"
                fontSize="sm"
                fontWeight="semibold"
                h={10}
                justifyContent="center"
                rounded="2xl"
                w={10}
              >
                S
              </Box>
              <Box>
                <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                  Sun Workspace
                </Text>
                <Text fontSize="md" fontWeight="semibold">
                  让项目更清晰
                </Text>
              </Box>
            </HStack>

            <HStack
              display={{ base: 'none', md: 'flex' }}
              spacing={6}
              fontSize="sm"
              fontWeight="medium"
              color="fg.muted"
            >
              <Box as="a" href="#">
                产品
              </Box>
              <Box as="a" href="#">
                解决方案
              </Box>
              <Box as="a" href="#">
                文档
              </Box>
              <Box as="a" href="#">
                定价
              </Box>
            </HStack>

            <HStack display={{ base: 'none', md: 'flex' }} spacing={3}>
              <ThemeToggle />
              <Button variant="outline" borderColor="border">
                登录
              </Button>
              <Button bg="fg" color="bg" _hover={{ bg: 'gray.800' }}>
                开始使用
              </Button>
            </HStack>

            <HStack display={{ base: 'flex', md: 'none' }} spacing={2}>
              <ThemeToggle />
              <Button variant="outline" borderColor="border">
                菜单
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Box as="section" py={{ base: 12, md: 16, lg: 20 }}>
        <Container maxW="6xl">
          <Stack
            align={{ base: 'stretch', lg: 'center' }}
            direction={{ base: 'column', lg: 'row' }}
            spacing={{ base: 10, lg: 16 }}
          >
            <Box flex="1">
              <Badge
                bg="bg.muted"
                color="fg.muted"
                px={3}
                py={1}
                rounded="full"
                fontSize="xs"
                fontWeight="medium"
              >
                Beta 版本开放中
              </Badge>
              <Heading
                as="h1"
                fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
                mt={4}
                lineHeight="1.1"
              >
                一个面向团队的轻量项目空间
              </Heading>
              <Text fontSize={{ base: 'md', md: 'lg' }} color="fg.muted" mt={4}>
                Sun 帮助你把任务、讨论、资料与里程碑统一在同一空间中，自动对齐节奏，减少重复沟通。
              </Text>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} mt={8}>
                <Button bg="fg" color="bg" _hover={{ bg: 'gray.800' }}>
                  预约演示
                </Button>
                <Button variant="outline" borderColor="border">
                  查看产品手册
                </Button>
              </Stack>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6} mt={8}>
                {stats.map((stat) => (
                  <Box key={stat.label}>
                    <Text fontSize="2xl" fontWeight="semibold">
                      {stat.value}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      {stat.label}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Box flex="1" w="full">
              <Box
                bg="bg.panel"
                border="1px solid"
                borderColor="border.muted"
                rounded="2xl"
                p={{ base: 5, md: 6 }}
                boxShadow="sm"
              >
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                      工作区概览
                    </Text>
                    <Text fontSize="lg" fontWeight="semibold">
                      Q1 产品节奏
                    </Text>
                  </Box>
                  <Badge bg="bg.muted" color="fg.muted" rounded="full" px={3}>
                    进行中
                  </Badge>
                </Flex>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mt={6}>
                  <Box bg="bg.muted" rounded="xl" p={4}>
                    <Text fontSize="sm" fontWeight="semibold">
                      关键里程碑
                    </Text>
                    <Text fontSize="sm" color="fg.muted" mt={2}>
                      4/6 个模块已就绪，测试正在推进。
                    </Text>
                  </Box>
                  <Box bg="bg.muted" rounded="xl" p={4}>
                    <Text fontSize="sm" fontWeight="semibold">
                      风险提示
                    </Text>
                    <Text fontSize="sm" color="fg.muted" mt={2}>
                      支付链路仍需评审，计划本周完成。
                    </Text>
                  </Box>
                </SimpleGrid>
                <Stack spacing={3} mt={6} fontSize="sm" color="fg.muted">
                  <Flex justify="space-between">
                    <Text>需求评审</Text>
                    <Text color="fg.subtle">周三 10:00</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>体验走查</Text>
                    <Text color="fg.subtle">周四 14:30</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>发布清单</Text>
                    <Text color="fg.subtle">周五 18:00</Text>
                  </Flex>
                </Stack>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Box as="section" py={{ base: 12, md: 16, lg: 20 }} borderTop="1px solid" borderColor="border.muted">
        <Container maxW="6xl">
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={6}
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
          >
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="fg.muted" textTransform="uppercase">
                核心能力
              </Text>
              <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} mt={2}>
                让团队信息回到同一频道
              </Heading>
            </Box>
            <Text maxW="xl" fontSize="md" color="fg.muted">
              提供从需求到交付的完整协作链路，兼顾执行效率与项目透明度。
            </Text>
          </Stack>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mt={10}>
            {features.map((feature) => (
              <Box
                key={feature.title}
                bg="bg.panel"
                border="1px solid"
                borderColor="border.muted"
                rounded="2xl"
                p={6}
                boxShadow="sm"
              >
                <Heading as="h3" fontSize="xl">
                  {feature.title}
                </Heading>
                <Text mt={3} color="fg.muted">
                  {feature.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      <Box as="section" py={{ base: 12, md: 16, lg: 20 }}>
        <Container maxW="6xl">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 10, lg: 16 }} alignItems="center">
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="fg.muted" textTransform="uppercase">
                落地路径
              </Text>
              <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} mt={2}>
                从搭建到运转只需三步
              </Heading>
              <Text mt={4} color="fg.muted">
                我们为不同规模的团队提供模板，确保你可以快速导入现有流程。
              </Text>
              <VStack align="stretch" spacing={4} mt={6}>
                {steps.map((item) => (
                  <HStack key={item.step} spacing={4} align="flex-start">
                    <Box
                      bg="bg.muted"
                      color="fg"
                      fontWeight="semibold"
                      rounded="full"
                      h={10}
                      w={10}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="sm"
                    >
                      {item.step}
                    </Box>
                    <Box>
                      <Text fontWeight="semibold">{item.title}</Text>
                      <Text fontSize="sm" color="fg.muted" mt={1}>
                        {item.description}
                      </Text>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
              {insights.map((item) => (
                <Box
                  key={item.title}
                  bg="bg.panel"
                  border="1px solid"
                  borderColor="border.muted"
                  rounded="2xl"
                  p={6}
                  boxShadow="sm"
                >
                  <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                    {item.title}
                  </Text>
                  <Text fontSize="2xl" fontWeight="semibold" mt={3}>
                    {item.value}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt={3}>
                    {item.description}
                  </Text>
                </Box>
              ))}
              <Box
                bg="bg.panel"
                border="1px solid"
                borderColor="border.muted"
                rounded="2xl"
                p={6}
                boxShadow="sm"
                gridColumn={{ base: 'auto', sm: '1 / -1' }}
              >
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  运营建议
                </Text>
                <Text mt={3} color="fg.muted">
                  邀请跨部门伙伴加入工作区，减少信息落差。
                </Text>
                <HStack spacing={2} mt={4} flexWrap="wrap">
                  {tags.map((tag) => (
                    <Badge key={tag} bg="bg.muted" color="fg.muted" rounded="full" px={3} py={1}>
                      {tag}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            </SimpleGrid>
          </SimpleGrid>
        </Container>
      </Box>

      <Box as="section" py={{ base: 12, md: 16, lg: 20 }} borderTop="1px solid" borderColor="border.muted">
        <Container maxW="6xl">
          <Box bg="gray.900" color="white" rounded="3xl" px={{ base: 6, md: 10 }} py={{ base: 10, md: 12 }}>
            <Stack direction={{ base: 'column', lg: 'row' }} spacing={8} align={{ lg: 'center' }}>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.700" textTransform="uppercase">
                  开始体验
                </Text>
                <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} mt={3}>
                  准备好为团队提速了吗？
                </Heading>
                <Text mt={3} color="whiteAlpha.800">
                  创建你的专属工作区，我们会在 24 小时内完成初始化支持。
                </Text>
              </Box>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
                <Button bg="white" color="gray.900" _hover={{ bg: 'whiteAlpha.900' }}>
                  获取试用
                </Button>
                <Button variant="outline" borderColor="whiteAlpha.400" color="white" _hover={{ bg: 'whiteAlpha.100' }}>
                  预约咨询
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box as="footer" borderTop="1px solid" borderColor="border.muted">
        <Container maxW="6xl" py={8}>
          <Flex direction={{ base: 'column', sm: 'row' }} gap={4} justify="space-between">
            <Text fontSize="sm" color="fg.muted">
              © 2026 Sun Workspace. All rights reserved.
            </Text>
            <HStack spacing={4} fontSize="sm" color="fg.muted">
              <Box as="a" href="#">
                隐私
              </Box>
              <Box as="a" href="#">
                条款
              </Box>
              <Box as="a" href="#">
                联系我们
              </Box>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

