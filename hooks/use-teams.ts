// "use client"

// import type React from "react"

// import { useState, useEffect } from "react"
// import { useSession } from "next-auth/react"

// type Team = {
//   id: string
//   name: string
//   logo: React.ElementType
//   plan: string
// }

// export function useTeams() {
//   const { data: session } = useSession()
//   const [teams, setTeams] = useState<Team[]>([])
//   const [activeTeam, setActiveTeam] = useState<Team | null>(null)
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     async function fetchTeams() {
//       if (session?.user?.id) {
//         try {
//           const response = await fetch("/api/teams")
//           const data = await response.json()
//           setTeams(data.teams)
//           setActiveTeam(data.activeTeam)
//         } catch (error) {
//           console.error("Failed to fetch teams:", error)
//         } finally {
//           setIsLoading(false)
//         }
//       }
//     }

//     fetchTeams()
//   }, [session])

//   return { teams, activeTeam, setActiveTeam, isLoading }
// }

