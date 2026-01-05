// adding an algorithm for most recent sort first, so that it will show images which are added recently, currently i dont have date in my places db so i am gonna use to sort by id which is storing data increasing order
export function recentFirstSort(data) {
  data.sort((a, b) => b.id - a.id);
  return data;
}
