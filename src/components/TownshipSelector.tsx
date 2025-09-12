import { useTownship } from "@/context/TownshipContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const TownshipSelector = () => {
  const { township, setTownship, availableTownships } = useTownship();
  const { t } = useTranslation("common");

  return (
    <Select value={township} onValueChange={setTownship}>
      <SelectTrigger className="w-[170px]">
        <SelectValue placeholder={t("selectors.selectTownship")} />
      </SelectTrigger>
      <SelectContent>
        {availableTownships.map((twp) => (
          <SelectItem key={twp} value={twp}>
            {twp}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TownshipSelector;

